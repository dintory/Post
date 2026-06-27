import fs from "fs";
import { Router } from "express";
import path from "path";
import os from "os";
import { getSupabaseClient, getServiceRoleClient } from "../config/supabase";
import { requireAuth } from "../middleware/requireAuth";
import {
  getAuthUrl,
  getTokens,
  getRefreshToken,
  saveRefreshToken,
  fetchChannelInfo,
  uploadVideo,
  setVideoThumbnail,
  downloadFromUrl,
  verifyToken,
  CATEGORY_MAP,
} from "../services/youtubeService";
import {
  getUserWebhookUrl,
  sendDiscordAlert,
} from "../services/discordWebhook";

const router = Router();

// ─── OAuth Flow ────────────────────────────────────────────────────────────

/**
 * GET /auth/youtube
 * Redirect the user to Google's OAuth consent page.
 * ?userId=xxx is passed as `state` so the callback can identify who authenticated.
 * When called with ?json=1, returns the URL as JSON (used by the frontend SPA
 * which needs to send auth headers via fetch before opening a new window).
 */
router.get("/auth/youtube", requireAuth, (req: any, res) => {
  const url = getAuthUrl(req.user.id);
  if (req.query.json === "1") {
    return res.json({ url });
  }
  res.redirect(302, url);
});

/**
 * GET /auth/youtube/callback
 * Handle the OAuth redirect — exchange code for tokens and persist to DB.
 * No auth middleware needed: the userId comes from the OAuth `state` parameter
 * that we set when initiating the flow.
 */
router.get("/auth/youtube/callback", async (req: any, res) => {
  const { code, state: userId } = req.query;

  if (!code) {
    return res.status(400).send("Missing authorization code.");
  }

  try {
    const tokens = await getTokens(code as string);

    if (!tokens.refresh_token) {
      return res
        .status(400)
        .send(
          "No refresh token received. Make sure to re-authenticate with prompt=consent.",
        );
    }

    // Use the userId from state (set by /auth/youtube)
    if (!userId) {
      return res.status(400).send("Missing user ID in OAuth state.");
    }
    const targetUserId = userId as string;
    const supabase = getServiceRoleClient();

    // Save the refresh token first
    await saveRefreshToken(
      supabase,
      targetUserId,
      "youtube-oauth",
      tokens.refresh_token,
    );
    console.log(`[YouTube] Token saved for user ${targetUserId}`);

    // Fetch real channel info from YouTube and update the account
    try {
      const channelInfo = await fetchChannelInfo(tokens.refresh_token!);
      await supabase
        .from("youtube_accounts")
        .update({
          channel_name: channelInfo.channelName,
          channel_id: channelInfo.channelId,
          subscriber_count: channelInfo.subscriberCount,
          video_count: channelInfo.videoCount,
          email: `${channelInfo.channelId}@youtube.com`,
          updated_at: new Date().toISOString(),
          last_sync_at: new Date().toISOString(),
        })
        .eq("user_id", targetUserId);
      console.log(`[YouTube] Channel info updated: ${channelInfo.channelName}`);
    } catch (channelErr) {
      console.error("[YouTube] Could not fetch channel info:", channelErr);
    }

    res.send(`
      <html>
        <head>
          <script>
            // Try to notify the opener app window, then redirect to it
            if (window.opener) {
              window.opener.postMessage({ type: 'youtube-oauth-success' }, '*');
              window.close();
            } else {
              const appUrl = 'https://post-mu-navy.vercel.app';
              setTimeout(function() {
                window.location.href = appUrl + '/accounts';
              }, 1500);
            }
          </script>
          <style>
            body { background:#0a0a0a; color:#e8e8e8; display:flex; align-items:center; justify-content:center; height:100vh; font-family:sans-serif; margin:0; }
            .card { text-align:center; }
            .card h1 { color:#10b981; }
            .card p { color:#909090; }
            .card .sub { color:#505050; font-size:13px; margin-top:16px; }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>✅ YouTube Connected</h1>
            <p>Your channel has been linked successfully.</p>
            <p class="sub">This tab will close automatically...</p>
          </div>
        </body>
      </html>
    `);
  } catch (err: any) {
    console.error("[YouTube] OAuth callback error:", err);
    res.status(500).send(`Authentication failed: ${err.message}`);
  }
});

// ─── Connected Accounts ────────────────────────────────────────────────────

/**
 * GET /api/youtube/accounts
 * List all connected YouTube accounts for the user.
 */
router.get("/api/youtube/accounts", requireAuth, async (req: any, res) => {
  try {
    const supabase = getSupabaseClient(req.token);
    const { listConnectedAccounts } =
      await import("../services/youtubeService");
    const accounts = await listConnectedAccounts(supabase, req.user.id);
    return res.json({ accounts });
  } catch (err: any) {
    console.error("[YouTube] List accounts error:", err);
    return res.status(500).json({ error: err.message });
  }
});

// ─── Token Status ──────────────────────────────────────────────────────────

/**
 * GET /api/youtube/status
 * Check whether the authenticated user's YouTube token is still valid.
 */
router.get("/api/youtube/status", requireAuth, async (req: any, res) => {
  try {
    const supabase = getSupabaseClient(req.token);
    const refreshToken = await getRefreshToken(supabase, req.user.id);

    if (!refreshToken) {
      return res.json({ connected: false });
    }

    const result = await verifyToken(refreshToken);
    return res.json({
      connected: result.valid,
      channelName: result.channelName,
      error: result.error,
    });
  } catch (err: any) {
    console.error("[YouTube] Status error:", err);
    return res.status(500).json({ error: err.message });
  }
});

// ─── Upload Endpoint ───────────────────────────────────────────────────────

/**
 * POST /api/youtube/upload
 * Upload a completed video from the pipeline to YouTube as PRIVATE.
 * Body: { jobId: string, accountId?: string }
 */
router.post("/api/youtube/upload", requireAuth, async (req: any, res) => {
  const { jobId, accountId } = req.body;

  if (!jobId) {
    return res.status(400).json({ error: "jobId is required" });
  }

  try {
    const supabase = getSupabaseClient(req.token);

    // 1. Fetch the job record
    const { data: job, error: fetchErr } = await supabase
      .from("video_queue")
      .select("*")
      .eq("id", jobId)
      .eq("user_id", req.user.id)
      .single();

    if (fetchErr || !job) {
      return res.status(404).json({ error: "Job not found" });
    }

    if (job.status !== "completed") {
      return res
        .status(425)
        .json({ error: `Job not ready — status: ${job.status}` });
    }

    if (job.yt_video_id) {
      return res.status(409).json({
        error: "Video already uploaded to YouTube",
        yt_video_id: job.yt_video_id,
      });
    }

    // 2. Get and validate the user's YouTube refresh token (specific account or first available)
    const refreshToken = await getRefreshToken(
      supabase,
      req.user.id,
      accountId,
    );
    if (!refreshToken) {
      return res.status(401).json({
        error:
          "No YouTube account connected. Go to Settings → Accounts to authenticate.",
        code: "NO_TOKEN",
      });
    }

    // Verify the token is still valid before starting the upload
    const tokenCheck = await verifyToken(refreshToken);
    if (!tokenCheck.valid) {
      return res.status(401).json({
        error:
          "YouTube connection expired or revoked. Please re-authenticate in Settings → Accounts.",
        code: "TOKEN_INVALID",
      });
    }

    // 3. Download the MP4 from R2 (or local)
    const tempDir = path.join(os.tmpdir(), "commissioner", "youtube-uploads");
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

    const localPath = path.join(tempDir, `${jobId}.mp4`);

    if (job.r2_url?.startsWith("http")) {
      await downloadFromUrl(job.r2_url, localPath);
    } else if (job.r2_url?.startsWith("local://")) {
      const fileName = job.r2_url.replace("local://", "");
      const localFile = path.join(os.tmpdir(), "commissioner", fileName);
      if (!fs.existsSync(localFile)) {
        return res
          .status(410)
          .json({ error: "Local video file no longer exists" });
      }
      fs.copyFileSync(localFile, localPath);
    } else {
      return res
        .status(404)
        .json({ error: "No video file found for this job" });
    }

    // 4. Fetch user's default video settings from the DB
    let uploadOptions: any = {};
    try {
      const { data: settings } = await supabase
        .from("user_usage")
        .select("video_settings")
        .eq("user_id", req.user.id)
        .maybeSingle();

      if (settings?.video_settings) {
        const vs = settings.video_settings;
        uploadOptions.privacyStatus = vs.privacy || "private";
        uploadOptions.categoryId = CATEGORY_MAP[vs.category] || undefined;
        uploadOptions.defaultLanguage = vs.language || undefined;
        // Build description from template (supports {title} placeholder)
        const descTemplate = vs.description || "";
        if (descTemplate) {
          uploadOptions.description = descTemplate.replace(
            /{title}/g,
            job.title,
          );
        }
      }
    } catch (settingsErr) {
      console.warn(
        "[YouTube] Could not load video settings, using defaults:",
        settingsErr,
      );
    }

    // 5. Upload to YouTube using user's default settings
    console.log(`[YouTube] Uploading "${job.title}" to YouTube...`);
    const result = await uploadVideo(
      localPath,
      job.title,
      uploadOptions.description ||
        job.description ||
        `Auto-generated by Commissioner`,
      refreshToken,
      uploadOptions,
    );
    console.log(`[YouTube] Upload complete: ${result.videoUrl}`);

    // 6. Set custom thumbnail on the YouTube video
    if (job.thumbnail_url && job.thumbnail_url.startsWith("http")) {
      try {
        const thumbRes = await fetch(job.thumbnail_url);
        if (thumbRes.ok) {
          const thumbBuffer = Buffer.from(await thumbRes.arrayBuffer());
          const tempThumb = path.join(tempDir, `${jobId}_thumb.jpg`);
          fs.writeFileSync(tempThumb, thumbBuffer);
          await setVideoThumbnail(result.videoId, tempThumb, refreshToken);
          fs.unlinkSync(tempThumb);
          console.log(`[YouTube] Thumbnail set for video ${result.videoId}`);
        }
      } catch (thumbErr) {
        console.warn("[YouTube] Could not set custom thumbnail:", thumbErr);
      }
    }

    // 7. Update the queue record
    await supabase
      .from("video_queue")
      .update({
        yt_video_id: result.videoId,
        yt_video_url: result.videoUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("id", jobId);

    // 8. Send Discord success notification
    try {
      const webhookUrl = await getUserWebhookUrl(supabase, req.user.id);
      await sendDiscordAlert(webhookUrl, {
        title: `Published: ${job.title}`,
        message: `Video was published to YouTube as ${uploadOptions.privacyStatus || "private"}.`,
        type: "success",
        jobId,
        fields: [
          { name: "YouTube URL", value: result.videoUrl, inline: false },
        ],
      });
    } catch (notifyErr) {
      console.warn("[YouTube] Discord notification error:", notifyErr);
    }

    // 8. Cleanup
    try {
      fs.unlinkSync(localPath);
    } catch {}

    return res.status(200).json({
      success: true,
      yt_video_id: result.videoId,
      yt_video_url: result.videoUrl,
    });
  } catch (err: any) {
    console.error("[YouTube] Upload error:", err);

    // Send Discord failure notification
    try {
      const supabase = getSupabaseClient(req.token);
      const webhookUrl = await getUserWebhookUrl(supabase, req.user.id);
      await sendDiscordAlert(webhookUrl, {
        title: "YouTube Upload Failed",
        message: err.message || "Unknown error",
        type: "failure",
        jobId,
      });
    } catch (notifyErr) {
      console.warn("[YouTube] Discord notification error:", notifyErr);
    }

    return res.status(500).json({ error: err.message });
  }
});

export default router;
