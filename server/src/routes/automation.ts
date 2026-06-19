import { Router } from "express";
import { getSupabaseClient } from "../config/supabase";
import { requireAuth } from "../middleware/requireAuth";
import {
  getUserWebhookUrl,
  sendDiscordAlert,
} from "../services/discordWebhook";

const router = Router();

// ─── Heartbeat check ────────────────────────────────────────────────────────

/**
 * GET/POST /api/automation/check
 * Called by an external cron service every 15 minutes.
 * Requires x-automation-secret header or ?secret= query param.
 * Fires schedules that are due and sends a single Discord notification.
 */
router.get("/check", handleCheck);
router.post("/check", handleCheck);

async function handleCheck(req: any, res: any) {
  const secret = req.headers["x-automation-secret"] || req.query.secret;
  if (!secret || secret !== process.env.AUTOMATION_SECRET) {
    return res
      .status(401)
      .json({ error: "Invalid or missing automation secret" });
  }

  try {
    const supabase = getSupabaseClient();
    const now = new Date();
    const currentDay = now.getUTCDay();
    const currentMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();

    // Fetch all enabled schedules
    const { data: schedules, error } = await supabase
      .from("automation_schedules")
      .select("*")
      .eq("enabled", true);

    if (error) {
      console.error("[Automation] Fetch error:", error);
      return res.status(500).json({ error: error.message });
    }

    let triggered = 0;
    const notifedUsers = new Set<string>();

    for (const schedule of schedules || []) {
      // Check day of week
      if (schedule.day_of_week !== currentDay) continue;

      // Parse scheduled time
      const [h, m] = schedule.time_utc.split(":").map(Number);
      const scheduledMinutes = h * 60 + m;

      // Match if schedule time is within the last 15 minutes (one cron interval)
      const minutesSinceSchedule = currentMinutes - scheduledMinutes;
      if (minutesSinceSchedule < 0 || minutesSinceSchedule > 15) continue;

      // Prevent double-fire within 20 hours
      if (schedule.last_run_at) {
        const lastRun = new Date(schedule.last_run_at).getTime();
        if (now.getTime() - lastRun < 20 * 60 * 60 * 1000) continue;
      }

      // Update last_run_at
      await supabase
        .from("automation_schedules")
        .update({
          last_run_at: now.toISOString(),
          updated_at: now.toISOString(),
        })
        .eq("id", schedule.id);

      // Collect unique users to notify (one webhook per user per cron tick)
      notifedUsers.add(schedule.user_id);
      triggered++;
    }

    // Send one notification per user with schedules that just fired
    for (const userId of notifedUsers) {
      const webhookUrl = await getUserWebhookUrl(supabase, userId);
      if (!webhookUrl) continue;

      await sendDiscordAlert(webhookUrl, {
        title: `⏰ ${triggered} Schedule${triggered > 1 ? "s" : ""} Fired`,
        message: `Your automation schedules were triggered at ${now.toISOString().replace("T", " ").slice(0, 19)} UTC.`,
        type: "warning",
      }).catch(() => {});
    }

    if (triggered > 0) {
      console.log(
        `[Automation] Fired ${triggered} schedule(s) for ${notifedUsers.size} user(s)`,
      );
    }

    return res
      .status(200)
      .json({ ok: true, triggered, users_notified: notifedUsers.size });
  } catch (err: any) {
    console.error("[Automation] Check error:", err);
    return res.status(500).json({ error: err.message });
  }
}

// ─── Test webhook ─────────────────────────────────────────────────────────────

/**
 * POST /api/automation/test-webhook
 * Send a test Discord webhook to the authenticated user.
 */
router.post("/test-webhook", requireAuth, async (req: any, res) => {
  try {
    const supabase = getSupabaseClient(req.token);
    const webhookUrl = await getUserWebhookUrl(supabase, req.user.id);

    if (!webhookUrl) {
      return res.status(404).json({
        error: "No Discord webhook configured. Save one in Settings first.",
      });
    }

    await sendDiscordAlert(webhookUrl, {
      title: "🔔 Test Notification",
      message:
        "This is a test from Commissioner. Your webhook is working correctly!",
      type: "success",
    });

    return res.json({ success: true, message: "Test webhook sent!" });
  } catch (err: any) {
    console.error("[Automation] Test webhook error:", err);
    return res.status(500).json({ error: err.message });
  }
});

// ─── User CRUD ──────────────────────────────────────────────────────────────

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
