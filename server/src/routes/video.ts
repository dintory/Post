import fs from "fs";
import path from "path";
import os from "os";
import https from "https";
import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth";
import { runVideoPipeline } from "../services/videoPipeline";
import {
  generateScript,
  listPromptTemplates,
} from "../services/scriptGenerator";
import {
  generateImage,
  generateImagesForScript,
} from "../services/imageGenerator";
import { listTemplates } from "../services/templateService";
import { listBackgrounds } from "../services/backgroundService";
import { supabase, getSupabaseClient } from "../config/supabase";
import { getRefreshToken } from "../services/youtubeService";
import type { VideoFormat } from "../types/video";
import {
  getCardLayoutFromPercent,
  type FrameDimensions,
  type VerticalPlacement,
} from "../shared/layoutEngine";

const VALID_FORMATS: VideoFormat[] = ["pov_slideshow", "reddit_story"];

const OUTPUT_FRAME: FrameDimensions = { width: 1080, height: 1920 };

const router = Router();

/** Fallback: fetch effects from user_usage DB if not passed in request body */
async function fetchEffectsFromDb(
  req: any,
): Promise<Record<string, any> | null> {
  try {
    const { data: userSettings } = await getSupabaseClient(req.token)
      .from("user_usage")
      .select("video_settings")
      .eq("user_id", req.user.id)
      .maybeSingle();
    return userSettings?.video_settings?.effects || null;
  } catch (err) {
    console.warn("[Video] Could not load effects from DB:", err);
    return null;
  }
}

// Generate a script via OpenRouter (standalone — does not start the full pipeline)
router.post("/generate-script", requireAuth, async (req: any, res) => {
  const {
    title,
    format,
    durationType,
    voiceStyle,
    pacing,
    musicStyle,
    imageStyle,
    subtitleStyle,
    aiModel,
  } = req.body;

  if (!title || !format) {
    return res.status(400).json({
      error: "Title and format are required",
      validFormats: VALID_FORMATS,
    });
  }

  if (!VALID_FORMATS.includes(format)) {
    return res.status(400).json({
      error: `Invalid format. Must be one of: ${VALID_FORMATS.join(", ")}`,
    });
  }

  try {
    const result = await generateScript({
      title,
      format,
      durationType,
      voiceStyle,
      pacing,
      musicStyle,
      imageStyle,
      subtitleStyle,
      aiModel,
    });

    return res.status(200).json({
      script: result.script,
      model: result.model,
    });
  } catch (error: any) {
    console.error("[Route] Script generation failed:", error);
    return res.status(500).json({ error: error.message });
  }
});

// List available prompt templates
router.get("/prompts", requireAuth, async (_req, res) => {
  try {
    const prompts = listPromptTemplates();
    return res.status(200).json({ prompts });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// List video overlay templates (Reddit card, POV slideshow, etc.)
router.get("/templates", requireAuth, async (_req, res) => {
  try {
    return res.status(200).json({ templates: listTemplates() });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// List background videos for a format
router.get("/backgrounds", requireAuth, async (req, res) => {
  try {
    const format = req.query.format as VideoFormat | undefined;
    const backgrounds = listBackgrounds(format).map(
      ({ absolutePath, ...rest }) => rest,
    );
    return res.status(200).json({ backgrounds });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// Generate a single image via OpenRouter
router.post("/generate-image", requireAuth, async (req: any, res) => {
  const { format, imagePrompt, sectionLabel, style } = req.body;

  if (!format || !imagePrompt) {
    return res.status(400).json({
      error: "format and imagePrompt are required",
      validFormats: VALID_FORMATS,
    });
  }

  if (!VALID_FORMATS.includes(format)) {
    return res.status(400).json({
      error: `Invalid format. Must be one of: ${VALID_FORMATS.join(", ")}`,
    });
  }

  try {
    const result = await generateImage({
      format,
      imagePrompt,
      sectionLabel,
      style,
    });
    return res.status(200).json(result);
  } catch (error: any) {
    console.error("[Route] Image generation failed:", error);
    return res.status(500).json({ error: error.message });
  }
});

// Generate images for all sections of a script
router.post("/generate-images", requireAuth, async (req: any, res) => {
  const { script, format, style } = req.body;

  if (!script?.sections || !format) {
    return res
      .status(400)
      .json({ error: "script with sections and format are required" });
  }

  if (!VALID_FORMATS.includes(format)) {
    return res.status(400).json({
      error: `Invalid format. Must be one of: ${VALID_FORMATS.join(", ")}`,
    });
  }

  try {
    const images = await generateImagesForScript(script, format, {
      uploadToR2: true,
      userId: req.user.id,
      jobId: `manual-${Date.now()}`,
      style,
    });

    return res.status(200).json({
      images: images.map(
        ({ sectionIndex, sectionLabel, r2Url, imagePrompt }) => ({
          sectionIndex,
          sectionLabel,
          r2Url,
          imagePrompt,
        }),
      ),
    });
  } catch (error: any) {
    console.error("[Route] Batch image generation failed:", error);
    return res.status(500).json({ error: error.message });
  }
});

// Trigger full video pipeline — returns jobId immediately, pipeline runs async
router.post("/process", requireAuth, async (req: any, res) => {
  const {
    title,
    format,
    scheduledAt,
    durationType,
    voiceStyle,
    pacing,
    musicStyle,
    imageStyle,
    subtitleStyle,
    aiModel,
    script, // optional: pre-generated script from wizard
    redditConfig,
    description,
  } = req.body;

  if (!title || !format) {
    return res.status(400).json({
      error: "Title and format are required",
      validFormats: VALID_FORMATS,
    });
  }

  if (!VALID_FORMATS.includes(format)) {
    return res.status(400).json({
      error: `Invalid format. Must be one of: ${VALID_FORMATS.join(", ")}`,
    });
  }

  try {
    // Use effects from request body (sent by frontend), or fall back to DB
    let effectsCapture: any =
      req.body.effects || (await fetchEffectsFromDb(req)) || {};
    let effectsRedditConfig = { ...(redditConfig || {}) };

    // ── Auto-upload: per-request override or user's saved setting ──────────
    let autoUpload = req.body.autoUpload === true;
    let ytRefreshToken: string | undefined;
    if (autoUpload || effectsCapture.autoUpload === true) {
      autoUpload = true;
      try {
        const token = await getRefreshToken(
          getSupabaseClient(req.token),
          req.user.id,
        );
        ytRefreshToken = token || undefined;
      } catch (tokenErr) {
        console.warn("[Video] Could not fetch YouTube token:", tokenErr);
      }
    }

    console.log(
      "[DEBUG:VIDEO] Effects from request:",
      JSON.stringify(effectsCapture, null, 2),
    );
    console.log(
      "[DEBUG:VIDEO] Initial redditConfig from body:",
      JSON.stringify(redditConfig, null, 2),
    );
    console.log(
      "[DEBUG:VIDEO] autoUpload:",
      autoUpload,
      "hasToken:",
      !!ytRefreshToken,
    );

    // Inject PFP avatar URL
    if (
      effectsCapture.pfpStyle === "default" &&
      effectsCapture.selectedPfpUrl
    ) {
      effectsRedditConfig.avatarSrc = effectsCapture.selectedPfpUrl;
      console.log(
        "[DEBUG:VIDEO] Set avatarSrc to:",
        effectsCapture.selectedPfpUrl,
      );
    }
    // Inject card placement. Prefer absolute full-res coordinates sent by the
    // client (guarantees 1:1 with the preview). Fall back to deriving them from
    // the placement label via the shared layout engine (matches the client's
    // preset formula exactly — do NOT use hardcoded magic numbers).
    if (
      effectsCapture.cardX != null &&
      effectsCapture.cardY != null &&
      effectsCapture.cardWidth != null
    ) {
      effectsRedditConfig.overlay = {
        ...(effectsRedditConfig.overlay || {}),
        marginTop: Math.round(effectsCapture.cardY),
        cardX: Math.round(effectsCapture.cardX),
        cardWidth: Math.round(effectsCapture.cardWidth),
      };
      console.log(
        "[DEBUG:VIDEO] Using absolute card position from client →",
        "cardX:",
        effectsCapture.cardX,
        "cardY:",
        effectsCapture.cardY,
        "cardWidth:",
        effectsCapture.cardWidth,
      );
    } else if (effectsCapture.cardPlacement) {
      const placement: VerticalPlacement =
        effectsCapture.cardPlacement === "custom"
          ? "bottom"
          : (effectsCapture.cardPlacement as VerticalPlacement);
      const layout = getCardLayoutFromPercent(
        OUTPUT_FRAME,
        placement,
        effectsCapture.cardWidthPercent ?? 52,
      );
      effectsRedditConfig.overlay = {
        ...(effectsRedditConfig.overlay || {}),
        marginTop: layout.y,
        cardX: layout.x,
        cardWidth: layout.width,
      };
      console.log(
        "[DEBUG:VIDEO] Derived card position from placement:",
        placement,
        "→",
        layout,
      );
    }

    console.log(
      "[DEBUG:VIDEO] Final effectsRedditConfig:",
      JSON.stringify(effectsRedditConfig, null, 2),
    );
    console.log(
      "[DEBUG:VIDEO] Caption fields:",
      JSON.stringify(
        {
          captionColor: effectsCapture.captionColor,
          captionOutlineEnabled: effectsCapture.captionOutline,
          captionOutlineWidth: effectsCapture.captionOutlineWidth,
          textPlacement: effectsCapture.textPlacement,
          captionAnimation: effectsCapture.captionAnimation,
          captionExit: effectsCapture.captionExit,
        },
        null,
        2,
      ),
    );

    const { jobId } = await runVideoPipeline({
      userId: req.user.id,
      title,
      format,
      scheduledAt,
      durationType,
      voiceStyle,
      pacing,
      musicStyle,
      imageStyle,
      subtitleStyle,
      aiModel,
      script,
      description,
      redditConfig: effectsRedditConfig,
      captionColor: effectsCapture.captionColor,
      captionOutlineEnabled: effectsCapture.captionOutline,
      captionOutlineWidth: effectsCapture.captionOutlineWidth,
      textPlacement: effectsCapture.textPlacement,
      captionX: effectsCapture.captionX,
      captionY: effectsCapture.captionY,
      captionScale: effectsCapture.captionScale,
      captionAnimation: effectsCapture.captionAnimation,
      captionExit: effectsCapture.captionExit,
      cardWidthPercent: effectsCapture.cardWidthPercent ?? 52,
      token: req.token,
      autoUpload,
      refreshToken: ytRefreshToken,
    });

    return res.status(202).json({
      message: "Video pipeline started.",
      status: "accepted",
      jobId,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// Stream the locally-rendered preview MP4 for a completed job
router.get("/preview/:id", requireAuth, async (req: any, res) => {
  const { id } = req.params;

  try {
    const { data, error } = await getSupabaseClient(req.token)
      .from("video_queue")
      .select("r2_url, status, user_id")
      .eq("id", id)
      .eq("user_id", req.user.id)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: "Job not found" });
    }

    if (data.status !== "completed") {
      return res
        .status(425)
        .json({ error: `Job not ready — status: ${data.status}` });
    }

    const r2Url: string = data.r2_url ?? "";

    // Proxy R2 video through the server so the browser gets it from the
    // same origin as the page — no CORS issues, auth is handled server-side.
    if (r2Url.startsWith("http://") || r2Url.startsWith("https://")) {
      // Fetch video metadata first for range request support
      const parsed = new URL(r2Url);
      const options: https.RequestOptions & {
        headers: Record<string, string>;
      } = {
        hostname: parsed.hostname,
        path: parsed.pathname + parsed.search,
        method: "GET",
        headers: {} as Record<string, string>,
      };

      // If the client sent a Range header, forward it to R2 so seeking works
      const rangeHeader = req.headers.range;
      if (rangeHeader) {
        options.headers["Range"] = rangeHeader as string;
      }

      res.setHeader("Content-Type", "video/mp4");
      res.setHeader("Accept-Ranges", "bytes");

      const proxyReq = https.request(options, (proxyRes) => {
        // Forward R2's status code (206 for partial content, 200 for full)
        res.statusCode = proxyRes.statusCode || 200;
        // Forward R2's content headers
        if (proxyRes.headers["content-length"]) {
          res.setHeader("Content-Length", proxyRes.headers["content-length"]!);
        }
        if (proxyRes.headers["content-range"]) {
          res.setHeader("Content-Range", proxyRes.headers["content-range"]!);
        }
        proxyRes.pipe(res);
      });

      proxyReq.on("error", (err) => {
        console.error("[Route] Proxy error:", err);
        if (!res.headersSent) {
          return res.status(502).json({ error: "Failed to proxy video" });
        }
      });

      proxyReq.end();
      return;
    }

    if (!r2Url.startsWith("local://")) {
      return res
        .status(404)
        .json({ error: "Preview file not available (no local path stored)" });
    }

    const fileName = r2Url.replace("local://", "");
    const filePath = path.join(os.tmpdir(), "commissioner", fileName);

    if (!fs.existsSync(filePath)) {
      return res
        .status(410)
        .json({ error: "Preview file has been cleaned up" });
    }

    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const rangeHeader = req.headers.range;

    res.setHeader("Content-Type", "video/mp4");
    res.setHeader("Accept-Ranges", "bytes");

    if (rangeHeader) {
      // Support range requests so the browser <video> element can seek
      const [rawStart, rawEnd] = rangeHeader.replace(/bytes=/, "").split("-");
      const start = parseInt(rawStart, 10);
      const end = rawEnd
        ? parseInt(rawEnd, 10)
        : Math.min(start + 1024 * 1024 - 1, fileSize - 1);
      const chunkSize = end - start + 1;

      res.status(206);
      res.setHeader("Content-Range", `bytes ${start}-${end}/${fileSize}`);
      res.setHeader("Content-Length", chunkSize);
      fs.createReadStream(filePath, { start, end }).pipe(res);
    } else {
      res.setHeader("Content-Length", fileSize);
      fs.createReadStream(filePath).pipe(res);
    }
  } catch (err: any) {
    console.error("[Route] Preview error:", err);
    return res.status(500).json({ error: err.message });
  }
});

// Get all video queue jobs for the authenticated user
router.get("/queue", requireAuth, async (req: any, res) => {
  try {
    const { data, error } = await getSupabaseClient(req.token)
      .from("video_queue")
      .select("*")
      .eq("user_id", req.user.id)
      .order("created_at", { ascending: false });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ jobs: data });
  } catch (err: any) {
    console.error("[Route] Queue fetch error:", err);
    return res.status(500).json({ error: err.message });
  }
});

// Get a single video queue job by ID
router.get("/queue/:id", requireAuth, async (req: any, res) => {
  const { id } = req.params;

  try {
    const { data, error } = await getSupabaseClient(req.token)
      .from("video_queue")
      .select("*")
      .eq("id", id)
      .eq("user_id", req.user.id)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: "Job not found" });
    }

    return res.status(200).json({ job: data });
  } catch (err: any) {
    console.error("[Route] Queue detail error:", err);
    return res.status(500).json({ error: err.message });
  }
});

// Delete a video queue job (and its file from R2)
router.delete("/queue/:id", requireAuth, async (req: any, res) => {
  const { id } = req.params;

  try {
    const supabaseClient = getSupabaseClient(req.token);

    // Fetch job to inspect r2_url
    const { data: job, error: fetchError } = await supabaseClient
      .from("video_queue")
      .select("*")
      .eq("id", id)
      .eq("user_id", req.user.id)
      .single();

    if (fetchError || !job) {
      return res.status(404).json({ error: "Job not found" });
    }

    // Delete from R2 if it is a public URL
    if (
      job.r2_url &&
      (job.r2_url.startsWith("http://") || job.r2_url.startsWith("https://"))
    ) {
      try {
        const { deleteFromR2 } = await import("../utils/r2");
        const urlParts = job.r2_url.split("/");
        const key = urlParts[urlParts.length - 1];
        if (key) {
          console.log(`[Route] Deleting file from R2 with key: ${key}`);
          await deleteFromR2(key);
        }
      } catch (r2Err) {
        console.error("[Route] Failed to delete file from R2:", r2Err);
      }
    }

    // Delete from Supabase video_queue
    const { error: deleteError } = await supabaseClient
      .from("video_queue")
      .delete()
      .eq("id", id)
      .eq("user_id", req.user.id);

    if (deleteError) {
      return res.status(500).json({ error: deleteError.message });
    }

    return res
      .status(200)
      .json({ success: true, message: "Video deleted successfully" });
  } catch (err: any) {
    console.error("[Route] Queue delete error:", err);
    return res.status(500).json({ error: err.message });
  }
});

// ─── Batch tag management ──────────────────────────────────────────────
router.patch("/tags", requireAuth, async (req: any, res) => {
  const { ids, tags, action } = req.body;

  if (!ids?.length || !tags || !["add", "remove", "set"].includes(action)) {
    return res.status(400).json({
      error: "ids[], tags[], and action ('add'|'remove'|'set') are required",
    });
  }

  try {
    const supabase = getSupabaseClient(req.token);

    // Fetch current tags for the selected videos
    const { data: videos, error: fetchErr } = await supabase
      .from("video_queue")
      .select("id, tags")
      .in("id", ids)
      .eq("user_id", req.user.id);

    if (fetchErr) {
      return res.status(500).json({ error: fetchErr.message });
    }

    const now = new Date().toISOString();

    for (const video of videos) {
      let newTags: string[];
      const currentTags: string[] = video.tags || [];

      switch (action) {
        case "add":
          newTags = [...new Set([...currentTags, ...tags])];
          break;
        case "remove":
          newTags = currentTags.filter((t: string) => !tags.includes(t));
          break;
        case "set":
          newTags = tags;
          break;
        default:
          continue;
      }

      await supabase
        .from("video_queue")
        .update({ tags: newTags, updated_at: now })
        .eq("id", video.id);
    }

    return res.status(200).json({ success: true });
  } catch (err: any) {
    console.error("[Route] Tags update error:", err);
    return res.status(500).json({ error: err.message });
  }
});

// Delete a tag from all of the user's videos
router.delete("/tags/:tag", requireAuth, async (req: any, res) => {
  const { tag } = req.params;

  if (!tag) {
    return res.status(400).json({ error: "Tag name is required" });
  }

  try {
    const supabase = getSupabaseClient(req.token);

    // Fetch all videos for this user that have the tag
    const { data: videos, error: fetchErr } = await supabase
      .from("video_queue")
      .select("id, tags")
      .eq("user_id", req.user.id)
      .contains("tags", [tag]);

    if (fetchErr) {
      return res.status(500).json({ error: fetchErr.message });
    }

    const now = new Date().toISOString();

    for (const video of videos) {
      const newTags = (video.tags || []).filter((t: string) => t !== tag);
      await supabase
        .from("video_queue")
        .update({ tags: newTags.length > 0 ? newTags : null, updated_at: now })
        .eq("id", video.id);
    }

    return res.status(200).json({ success: true, affected: videos.length });
  } catch (err: any) {
    console.error("[Route] Tag delete error:", err);
    return res.status(500).json({ error: err.message });
  }
});

// Get all unique tags for the authenticated user
router.get("/tags", requireAuth, async (req: any, res) => {
  try {
    const supabase = getSupabaseClient(req.token);

    const { data, error } = await supabase
      .from("video_queue")
      .select("tags")
      .eq("user_id", req.user.id)
      .not("tags", "is", null);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    const allTags = [...new Set(data.flatMap((v: any) => v.tags || []))].sort();

    return res.status(200).json({ tags: allTags });
  } catch (err: any) {
    console.error("[Route] Tags fetch error:", err);
    return res.status(500).json({ error: err.message });
  }
});

// Edit/update a video queue job title or scheduled_at time
router.patch("/queue/:id", requireAuth, async (req: any, res) => {
  const { id } = req.params;
  const { title, scheduledAt } = req.body;

  try {
    const supabaseClient = getSupabaseClient(req.token);

    // Verify ownership
    const { data: job, error: fetchError } = await supabaseClient
      .from("video_queue")
      .select("id")
      .eq("id", id)
      .eq("user_id", req.user.id)
      .single();

    if (fetchError || !job) {
      return res.status(404).json({ error: "Job not found" });
    }

    const updates: any = {
      updated_at: new Date().toISOString(),
    };
    if (title !== undefined) updates.title = title;
    if (scheduledAt !== undefined) updates.scheduled_at = scheduledAt;

    const { data: updatedJob, error: updateError } = await supabaseClient
      .from("video_queue")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      return res.status(500).json({ error: updateError.message });
    }

    return res.status(200).json({ job: updatedJob });
  } catch (err: any) {
    console.error("[Route] Queue update error:", err);
    return res.status(500).json({ error: err.message });
  }
});

export default router;
