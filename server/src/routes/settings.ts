import { Router } from "express";
import { getSupabaseClient } from "../config/supabase";
import { requireAuth } from "../middleware/requireAuth";

const router = Router();

// Get all settings for the authenticated user
router.get("/", requireAuth, async (req: any, res) => {
  try {
    const supabase = getSupabaseClient(req.token);

    const { data, error } = await supabase
      .from("user_usage")
      .select(
        "video_settings, security_settings, notification_settings, discord_webhook_url",
      )
      .eq("user_id", req.user.id)
      .maybeSingle();

    if (error) return res.status(500).json({ error: error.message });

    // Return defaults if no row exists yet
    if (!data) {
      return res.status(200).json({
        settings: {
          video_settings: {
            privacy: "public",
            category: "Education",
            language: "English",
            allowComments: true,
          },
          security_settings: { autoSave: true, confirmBeforePublish: true },
          notification_settings: {
            email: true,
            push: true,
            videoPublished: true,
            accountIssues: true,
            weeklyReports: false,
          },
          discord_webhook_url: null,
        },
      });
    }

    return res.status(200).json({ settings: data });
  } catch (err: any) {
    console.error("[Settings] Fetch error:", err);
    return res.status(500).json({ error: err.message });
  }
});

// Update settings for the authenticated user
router.patch("/", requireAuth, async (req: any, res) => {
  const {
    video_settings,
    security_settings,
    notification_settings,
    discord_webhook_url,
  } = req.body;

  try {
    const supabase = getSupabaseClient(req.token);
    const now = new Date().toISOString();

    // Build update payload — only include fields that were sent
    const updates: Record<string, any> = { updated_at: now };

    // For JSONB columns, merge with existing values instead of replacing
    if (video_settings !== undefined) {
      // Fetch existing row to merge nested JSONB
      const { data: existing } = await supabase
        .from("user_usage")
        .select("video_settings")
        .eq("user_id", req.user.id)
        .maybeSingle();

      const merged = existing?.video_settings
        ? { ...existing.video_settings, ...video_settings }
        : video_settings;
      updates.video_settings = merged;
    }

    if (security_settings !== undefined)
      updates.security_settings = security_settings;
    if (notification_settings !== undefined)
      updates.notification_settings = notification_settings;
    if (discord_webhook_url !== undefined)
      updates.discord_webhook_url = discord_webhook_url;

    // Upsert: insert if no row exists, update if it does
    const { data, error } = await supabase
      .from("user_usage")
      .upsert({ user_id: req.user.id, ...updates }, { onConflict: "user_id" })
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ settings: data });
  } catch (err: any) {
    console.error("[Settings] Update error:", err);
    return res.status(500).json({ error: err.message });
  }
});

export default router;
