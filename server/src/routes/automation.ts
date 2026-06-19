import { Router } from "express";
import { getSupabaseClient } from "../config/supabase";
import { requireAuth } from "../middleware/requireAuth";
import { sendDiscordAlert } from "../services/discordWebhook";

const router = Router();

// ─── Heartbeat check ────────────────────────────────────────────────────────

/**
 * POST /api/automation/check
 * Called by an external cron service every 15 minutes.
 * Requires x-automation-secret header matching AUTOMATION_SECRET env var.
 * Queries all enabled schedules and triggers any that are due.
 */
router.get("/check", handleCheck);
router.post("/check", handleCheck);

async function handleCheck(req: any, res: any) {
  const secret = req.headers["x-automation-secret"] || req.query.secret;
  if (secret !== process.env.AUTOMATION_SECRET) {
    return res
      .status(401)
      .json({ error: "Invalid or missing automation secret" });
  }

  try {
    const supabase = getSupabaseClient();
    const now = new Date();

    // Send a webhook to every user who has one configured
    const { data: users } = await supabase
      .from("user_usage")
      .select("user_id, discord_webhook_url")
      .not("discord_webhook_url", "is", null);

    let sent = 0;

    for (const user of users || []) {
      await sendDiscordAlert(user.discord_webhook_url, {
        title: "💓 Automation Heartbeat",
        message: `Automation system check at ${now.toISOString().replace("T", " ").slice(0, 19)} UTC.`,
        type: "success",
      }).catch(() => {});
      sent++;
    }

    console.log(`[Automation] Heartbeat sent to ${sent} user(s)`);
    return res.status(200).json({ ok: true, notified: sent });
  } catch (err: any) {
    console.error("[Automation] Check error:", err);
    return res.status(500).json({ error: err.message });
  }
}

// ─── User CRUD ──────────────────────────────────────────────────────────────

/**
 * GET /api/automation/schedules
 * List all schedules for the authenticated user.
 */
router.get("/schedules", requireAuth, async (req: any, res) => {
  try {
    const supabase = getSupabaseClient(req.token);
    const { data, error } = await supabase
      .from("automation_schedules")
      .select("*")
      .eq("user_id", req.user.id)
      .order("day_of_week", { ascending: true });

    if (error) return res.status(500).json({ error: error.message });
    return res.json({ schedules: data || [] });
  } catch (err: any) {
    console.error("[Automation] List error:", err);
    return res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/automation/schedules
 * Create or update a schedule for the authenticated user.
 */
router.post("/schedules", requireAuth, async (req: any, res) => {
  const { id, day_of_week, time_utc, enabled } = req.body;

  if (day_of_week === undefined || time_utc === undefined) {
    return res
      .status(400)
      .json({ error: "day_of_week and time_utc are required" });
  }

  if (day_of_week < 0 || day_of_week > 6) {
    return res.status(400).json({ error: "day_of_week must be 0-6" });
  }

  if (!/^\d{2}:\d{2}$/.test(time_utc)) {
    return res.status(400).json({ error: "time_utc must be in HH:mm format" });
  }

  try {
    const supabase = getSupabaseClient(req.token);
    const now = new Date().toISOString();

    if (id) {
      // Update existing
      const { data, error } = await supabase
        .from("automation_schedules")
        .update({
          day_of_week,
          time_utc,
          enabled: enabled !== undefined ? enabled : true,
          updated_at: now,
        })
        .eq("id", id)
        .eq("user_id", req.user.id)
        .select()
        .single();

      if (error) return res.status(500).json({ error: error.message });
      return res.json({ schedule: data });
    } else {
      // Create new
      const { data, error } = await supabase
        .from("automation_schedules")
        .insert({
          user_id: req.user.id,
          day_of_week,
          time_utc,
          enabled: enabled !== undefined ? enabled : true,
        })
        .select()
        .single();

      if (error) return res.status(500).json({ error: error.message });
      return res.status(201).json({ schedule: data });
    }
  } catch (err: any) {
    console.error("[Automation] Save error:", err);
    return res.status(500).json({ error: err.message });
  }
});

/**
 * DELETE /api/automation/schedules/:id
 * Delete a schedule for the authenticated user.
 */
router.delete("/schedules/:id", requireAuth, async (req: any, res) => {
  const { id } = req.params;

  try {
    const supabase = getSupabaseClient(req.token);
    const { error } = await supabase
      .from("automation_schedules")
      .delete()
      .eq("id", id)
      .eq("user_id", req.user.id);

    if (error) return res.status(500).json({ error: error.message });
    return res.json({ success: true });
  } catch (err: any) {
    console.error("[Automation] Delete error:", err);
    return res.status(500).json({ error: err.message });
  }
});

export default router;
