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
 * POST /api/automation/check
 * Called by an external cron service every 15 minutes.
 * Requires x-automation-secret header matching AUTOMATION_SECRET env var.
 * Queries all enabled schedules and triggers any that are due.
 */
router.post("/check", async (req, res) => {
  const secret = req.headers["x-automation-secret"];
  if (secret !== process.env.AUTOMATION_SECRET) {
    return res
      .status(401)
      .json({ error: "Invalid or missing automation secret" });
  }

  try {
    const supabase = getSupabaseClient();
    const now = new Date();
    const currentDay = now.getUTCDay(); // 0=Sun, 1=Mon ... 6=Sat
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

    for (const schedule of schedules || []) {
      // Check day of week
      if (schedule.day_of_week !== currentDay) continue;

      // Parse scheduled time
      const [h, m] = schedule.time_utc.split(":").map(Number);
      const scheduledMinutes = h * 60 + m;

      // Allow a ±10 minute tolerance window
      const diff = Math.abs(currentMinutes - scheduledMinutes);
      if (diff > 10) continue;

      // Prevent double-firing: skip if last_run_at is within the last 20 hours
      if (schedule.last_run_at) {
        const lastRun = new Date(schedule.last_run_at).getTime();
        if (now.getTime() - lastRun < 20 * 60 * 60 * 1000) continue;
      }

      // ── Fire the schedule notification (fire-and-forget) ─────────────
      triggerUserSchedule(
        supabase,
        schedule.user_id,
        schedule.id,
        schedule.day_of_week,
        schedule.time_utc,
      ).catch((err) => {
        console.error(
          `[Automation] Schedule notification error for ${schedule.id}:`,
          err,
        );
      });

      // Update last_run_at immediately to prevent re-triggering
      await supabase
        .from("automation_schedules")
        .update({
          last_run_at: now.toISOString(),
          updated_at: now.toISOString(),
        })
        .eq("id", schedule.id);

      triggered++;
    }

    return res.status(200).json({ checked: true, triggered });
  } catch (err: any) {
    console.error("[Automation] Check error:", err);
    return res.status(500).json({ error: err.message });
  }
});

/**
 * Send a Discord notification when a schedule triggers.
 * Video publishing logic will be wired here in a future update.
 */
async function triggerUserSchedule(
  supabase: any,
  userId: string,
  scheduleId: string,
  dayOfWeek: number,
  timeUtc: string,
) {
  const webhookUrl = await getUserWebhookUrl(supabase, userId);
  if (!webhookUrl) return;

  const dayNames = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  await sendDiscordAlert(webhookUrl, {
    title: "⏰ Automation Schedule Triggered",
    message: `Your scheduled posting time has arrived.`,
    type: "warning",
    jobId: scheduleId.slice(0, 8),
    fields: [
      { name: "Day", value: dayNames[dayOfWeek] || "Unknown", inline: true },
      { name: "Time (UTC)", value: timeUtc, inline: true },
      {
        name: "Status",
        value: "Your schedule fired — video publishing will be added soon.",
        inline: false,
      },
    ],
  });

  console.log(
    `[Automation] Notified user ${userId} for schedule ${scheduleId}`,
  );
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
