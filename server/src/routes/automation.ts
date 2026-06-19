import { Router } from "express";
import { getSupabaseClient } from "../config/supabase";
import { requireAuth } from "../middleware/requireAuth";

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
    return res.status(401).json({ error: "Invalid or missing automation secret" });
  }

  try {
    const supabase = getSupabaseClient();
    const now = new Date();
    const currentDay = now.getUTCDay();       // 0=Sun, 1=Mon ... 6=Sat
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

      // ── Trigger the pipeline for this user ────────────────────────────
      // Fire and forget — do not block the response
      triggerUserPipeline(supabase, schedule.user_id, schedule.id).catch((err) => {
        console.error(`[Automation] Pipeline trigger error for schedule ${schedule.id}:`, err);
      });

      // Update last_run_at immediately to prevent re-triggering
      await supabase
        .from("automation_schedules")
        .update({ last_run_at: now.toISOString(), updated_at: now.toISOString() })
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
 * Fire the video pipeline for a user asynchronously.
 * Uses the user's stored settings to generate a video.
 */
async function triggerUserPipeline(supabase: any, userId: string, scheduleId: string) {
  // Fetch a pending or default account for this user
  const { data: accounts } = await supabase
    .from("youtube_accounts")
    .select("id, channel_name")
    .eq("user_id", userId)
    .limit(1);

  const accountLabel = accounts?.[0]?.channel_name || "Auto";

  // Find a completed video to re-publish, or just log for now
  const { data: videos } = await supabase
    .from("video_queue")
    .select("id, title")
    .eq("user_id", userId)
    .eq("status", "completed")
    .is("yt_video_id", null)
    .limit(1);

  if (videos && videos.length > 0) {
    console.log(`[Automation] Schedule ${scheduleId}: Ready to publish "${videos[0].title}" for user ${userId}`);
    // The actual publish step can be triggered via the existing YouTube upload endpoint.
    // For now, we log readiness — the external cron + check endpoint handles scheduling.
  } else {
    console.log(`[Automation] Schedule ${scheduleId}: No pending videos for user ${userId}`);
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
    return res.status(400).json({ error: "day_of_week and time_utc are required" });
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
