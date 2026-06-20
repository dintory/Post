import { Router } from "express";
import { getSupabaseClient } from "../config/supabase";
import { requireAuth } from "../middleware/requireAuth";
import {
  getUserWebhookUrl,
  sendDiscordAlert,
} from "../services/discordWebhook";

const router = Router();

// ─── Heartbeat check ────────────────────────────────────────────────────────

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
    const currentMonthDay = now.getUTCDate();
    const currentMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();
    const currentHour = now.getUTCHours();

    const { data: schedules, error } = await supabase
      .from("automation_schedules")
      .select("*")
      .eq("enabled", true);

    if (error) {
      console.error("[Automation] Fetch error:", error);
      return res.status(500).json({ error: error.message });
    }

    let triggered = 0;
    const notifiedUsers = new Map<string, string[]>();

    for (const schedule of schedules || []) {
      const type = schedule.schedule_type || "weekly";
      let shouldFire = false;

      if (type === "weekly") {
        // Match day of week + time within ±5 min
        if (schedule.day_of_week !== currentDay) continue;
        const [h, m] = (schedule.time_utc || "00:00").split(":").map(Number);
        const scheduledMinutes = h * 60 + m;
        const diff = Math.abs(currentMinutes - scheduledMinutes);
        if (diff > 5) continue;
        shouldFire = true;
      } else if (type === "daily") {
        // Match time within ±5 min every day
        const [h, m] = (schedule.time_utc || "00:00").split(":").map(Number);
        const scheduledMinutes = h * 60 + m;
        const diff = Math.abs(currentMinutes - scheduledMinutes);
        if (diff > 5) continue;
        shouldFire = true;
      } else if (type === "interval") {
        // Every N hours from last run
        const intervalHours = schedule.interval_hours || 6;
        if (!schedule.last_run_at) {
          shouldFire = true; // Never run before, fire now
        } else {
          const lastRun = new Date(schedule.last_run_at).getTime();
          const hoursSinceLastRun =
            (now.getTime() - lastRun) / (1000 * 60 * 60);
          if (hoursSinceLastRun >= intervalHours) {
            shouldFire = true;
          }
        }
      } else if (type === "monthly") {
        // Match specific day of month + time within ±5 min
        if (schedule.month_day !== currentMonthDay) continue;
        const [h, m] = (schedule.time_utc || "00:00").split(":").map(Number);
        const scheduledMinutes = h * 60 + m;
        const diff = Math.abs(currentMinutes - scheduledMinutes);
        if (diff > 5) continue;
        shouldFire = true;
      }

      if (!shouldFire) continue;

      // Prevent double-fire within the last 20 hours (for non-interval types)
      if (type !== "interval" && schedule.last_run_at) {
        const lastRun = new Date(schedule.last_run_at).getTime();
        if (now.getTime() - lastRun < 20 * 60 * 60 * 1000) continue;
      }

      await supabase
        .from("automation_schedules")
        .update({
          last_run_at: now.toISOString(),
          updated_at: now.toISOString(),
        })
        .eq("id", schedule.id);

      // Fire the video pipeline asynchronously (fire-and-forget)
      (async () => {
        try {
          const { runVideoPipeline } =
            await import("../services/videoPipeline");
          const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
          if (!serviceRoleKey) {
            console.warn(
              "[Automation] SUPABASE_SERVICE_ROLE_KEY not set, skipping pipeline",
            );
            return;
          }
          const autoTitle = schedule.label
            ? `${schedule.label} #${Math.floor(Date.now() / 1000)}`
            : `Automated Video #${Math.floor(Date.now() / 1000)}`;

          // Fetch the user's YouTube refresh token for auto-upload
          let ytRefreshToken: string | null = null;
          try {
            const { data: ytAccount } = await supabase
              .from("youtube_accounts")
              .select("refresh_token")
              .eq("user_id", schedule.user_id)
              .not("refresh_token", "is", null)
              .maybeSingle();
            ytRefreshToken = ytAccount?.refresh_token || null;
          } catch {
            console.warn(
              `[Automation] Could not fetch YouTube token for user ${schedule.user_id}`,
            );
          }

          // Fetch user's saved effects settings for the reddit card config
          let effectsRedditConfig: any = {};
          let effectsCapture: any = {};
          try {
            const { data: userSettings } = await supabase
              .from("user_usage")
              .select("video_settings")
              .eq("user_id", schedule.user_id)
              .maybeSingle();

            const effects = userSettings?.video_settings?.effects;
            if (effects) {
              effectsCapture = effects;
              if (effects.pfpStyle === "default" && effects.selectedPfpUrl) {
                effectsRedditConfig.avatarSrc = effects.selectedPfpUrl;
              }
              if (effects.cardPlacement) {
                // Values scaled from preview (360×640) to final output (1080×1920)
                const marginTop =
                  effects.cardPlacement === "top"
                    ? 80
                    : effects.cardPlacement === "center"
                      ? 540
                      : 1000;
                effectsRedditConfig.overlay = {
                  ...(effectsRedditConfig.overlay || {}),
                  marginTop,
                };
              }
            }
          } catch {
            console.warn(
              `[Automation] Could not fetch effects for user ${schedule.user_id}`,
            );
          }

          await runVideoPipeline({
            userId: schedule.user_id,
            title: autoTitle,
            format: "reddit_story",
            redditConfig: effectsRedditConfig,
            captionColor: effectsCapture.captionColor,
            captionOutlineEnabled: effectsCapture.captionOutline,
            captionOutlineWidth: effectsCapture.captionOutlineWidth,
            textPlacement: effectsCapture.textPlacement,
            captionAnimation: effectsCapture.captionAnimation,
            captionExit: effectsCapture.captionExit,
            token: serviceRoleKey,
            autoUpload: true,
            refreshToken: ytRefreshToken || undefined,
          });
          console.log(
            `[Automation] Pipeline triggered for schedule ${schedule.id}`,
          );
        } catch (err) {
          console.error(
            `[Automation] Failed to trigger pipeline for schedule ${schedule.id}:`,
            err,
          );
        }
      })();

      const existing = notifiedUsers.get(schedule.user_id) || [];
      existing.push(schedule.label || type);
      notifiedUsers.set(schedule.user_id, existing);
      triggered++;
    }

    // Send one notification per user
    for (const [userId, labels] of notifiedUsers) {
      const webhookUrl = await getUserWebhookUrl(supabase, userId);
      if (!webhookUrl) continue;

      const uniqueLabels = [...new Set(labels)];
      await sendDiscordAlert(webhookUrl, {
        title: `⏰ ${triggered} Schedule${triggered > 1 ? "s" : ""} Fired`,
        message: `Triggered: ${uniqueLabels.join(", ")} at ${now.toISOString().replace("T", " ").slice(0, 19)} UTC.`,
        type: "warning",
        fields: [
          {
            name: "Pipeline Generated",
            value: "Yes",
            inline: true,
          },
        ],
      }).catch(() => {});
    }

    if (triggered > 0) {
      console.log(
        `[Automation] Fired ${triggered} schedule(s) for ${notifiedUsers.size} user(s)`,
      );
    }

    return res
      .status(200)
      .json({ ok: true, triggered, users_notified: notifiedUsers.size });
  } catch (err: any) {
    console.error("[Automation] Check error:", err);
    return res.status(500).json({ error: err.message });
  }
}

// ─── Test webhook ─────────────────────────────────────────────────────────────

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

// ─── Manual test trigger ───────────────────────────────────────────────────────

router.post("/test-trigger/:scheduleId", async (req: any, res: any) => {
  const secret = req.headers["x-automation-secret"] || req.query.secret;
  if (!secret || secret !== process.env.AUTOMATION_SECRET) {
    return res
      .status(401)
      .json({ error: "Invalid or missing automation secret" });
  }

  const { scheduleId } = req.params;

  try {
    const supabase = getSupabaseClient();
    const { data: schedule, error } = await supabase
      .from("automation_schedules")
      .select("*")
      .eq("id", scheduleId)
      .single();

    if (error || !schedule) {
      return res.status(404).json({ error: "Schedule not found" });
    }

    const type = schedule.schedule_type || "weekly";
    let description = `"${schedule.label || "Untitled"}" (${type}`;
    if (schedule.time_utc) description += ` at ${schedule.time_utc} UTC`;
    if (schedule.day_of_week !== null)
      description += `, day ${schedule.day_of_week}`;
    if (schedule.month_day)
      description += `, day ${schedule.month_day} of month`;
    if (schedule.interval_hours)
      description += `, every ${schedule.interval_hours}h`;
    description += `)`;

    sendDiscordAlert(await getUserWebhookUrl(supabase, schedule.user_id), {
      title: "🧪 Test Trigger",
      message: `Manual test of schedule ${description}`,
      type: "success",
    }).catch(() => {});

    console.log(`[Automation] Test trigger fired for schedule ${scheduleId}`);
    return res.json({ success: true, message: "Test trigger fired!" });
  } catch (err: any) {
    console.error("[Automation] Test trigger error:", err);
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
      .order("created_at", { ascending: true });

    if (error) return res.status(500).json({ error: error.message });
    return res.json({ schedules: data || [] });
  } catch (err: any) {
    console.error("[Automation] List error:", err);
    return res.status(500).json({ error: err.message });
  }
});

router.post("/schedules", requireAuth, async (req: any, res) => {
  const {
    id,
    schedule_type,
    day_of_week,
    time_utc,
    interval_hours,
    month_day,
    enabled,
    label,
  } = req.body;

  const type = schedule_type || "weekly";

  if (type === "interval") {
    if (!interval_hours || interval_hours < 1) {
      return res
        .status(400)
        .json({ error: "interval_hours is required and must be >= 1" });
    }
  } else {
    if (!time_utc) {
      return res
        .status(400)
        .json({ error: "time_utc is required for this schedule type" });
    }
    if (type === "weekly" && day_of_week === undefined) {
      return res
        .status(400)
        .json({ error: "day_of_week is required for weekly schedules" });
    }
    if (type === "monthly" && !month_day) {
      return res
        .status(400)
        .json({ error: "month_day is required for monthly schedules" });
    }
  }

  try {
    const supabase = getSupabaseClient(req.token);
    const now = new Date().toISOString();

    const fields: any = {
      schedule_type: type,
      enabled: enabled !== undefined ? enabled : true,
      label: label || "",
      updated_at: now,
    };

    if (type === "weekly") {
      fields.day_of_week = day_of_week;
      fields.time_utc = time_utc;
      fields.interval_hours = null;
      fields.month_day = null;
    } else if (type === "daily") {
      fields.day_of_week = null;
      fields.time_utc = time_utc;
      fields.interval_hours = null;
      fields.month_day = null;
    } else if (type === "interval") {
      fields.day_of_week = null;
      fields.time_utc = null;
      fields.interval_hours = interval_hours;
      fields.month_day = null;
    } else if (type === "monthly") {
      fields.day_of_week = null;
      fields.time_utc = time_utc;
      fields.interval_hours = null;
      fields.month_day = month_day;
    }

    if (id) {
      const { data, error } = await supabase
        .from("automation_schedules")
        .update(fields)
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
          ...fields,
          user_id: req.user.id,
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
