import fs from "fs";
import path from "path";
import { supabase, getSupabaseClient } from "../config/supabase";
import { generateScript } from "./scriptGenerator";
import { generateImagesForScript } from "./imageGenerator";
import {
  getTemplateForFormat,
  buildRedditCardConfig,
  resolveRedditCardConfig,
} from "./templateService";
import { getDefaultBackground } from "./backgroundService";
import { generateVoiceover, generateSpeechMarks } from "./ttsService";
import { generateRedditCardSvg, svgToPng } from "./svgService";
import {
  getTempDir,
  getAudioDuration,
  trimVideoToAudio,
  mergeAudioVideo,
  cleanupFiles,
  speedUpAudio,
} from "./ffmpegService";
import type { VideoGenerationJob } from "../types/video";

// ─── Concurrency limiter: max 1 pipeline at a time (512MB RAM limit) ──────
const MAX_CONCURRENT_PIPELINES = 1;
let activePipelines = 0;
const pipelineQueue: (() => void)[] = [];

const acquirePipelineSlot = async (): Promise<void> => {
  if (activePipelines < MAX_CONCURRENT_PIPELINES) {
    activePipelines++;
    return;
  }
  return new Promise((resolve) => {
    pipelineQueue.push(() => {
      activePipelines++;
      resolve();
    });
  });
};

const releasePipelineSlot = (): void => {
  activePipelines--;
  const next = pipelineQueue.shift();
  if (next) next();
};

export type {
  VideoFormat,
  VideoGenerationJob,
  VideoQueueStatus,
} from "../types/video";

export const runVideoPipeline = async (
  job: VideoGenerationJob,
): Promise<{ jobId: string }> => {
  const {
    userId,
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
    script: preGeneratedScript,
    redditConfig,
    description,
    autoUpload,
    refreshToken: ytRefreshToken,
    captionColor,
    captionOutlineEnabled,
    captionOutlineWidth,
    textPlacement,
    captionAnimation,
    captionExit,
  } = job;
  const now = new Date().toISOString();

  const db = getSupabaseClient(job.token);

  console.log(`[Pipeline] Creating queue record for "${title}" (${format})`);
  const { data: queueRecord, error: initError } = await db
    .from("video_queue")
    .insert([
      {
        user_id: userId,
        title,
        description: description || null,
        format,
        status: "generating",
        scheduled_at: scheduledAt ?? null,
        updated_at: now,
      },
    ])
    .select()
    .single();

  if (initError) {
    console.error("[Pipeline] Error initializing queue record:", initError);
    throw new Error(`Failed to initialize video queue: ${initError.message}`);
  }

  const recordId = queueRecord.id;

  // ─── Run async — don't await, caller gets jobId immediately ─────────────
  (async () => {
    await acquirePipelineSlot();
    const tempDir = getTempDir();
    const rawMp3Path = path.join(tempDir, `${recordId}_voiceover_raw.mp3`);
    const mp3Path = path.join(tempDir, `${recordId}_voiceover.mp3`);
    const bgTrimPath = path.join(tempDir, `${recordId}_bg_trimmed.mp4`);
    const finalPath = path.join(tempDir, `${recordId}_final.mp4`);

    try {
      // ── 1. Script ─────────────────────────────────────────────────────────
      let script = preGeneratedScript;
      if (!script) {
        console.log(`[Pipeline] Generating script for: ${title}`);
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
        script = result.script;
      } else {
        console.log(`[Pipeline] Using pre-generated script for: ${title}`);
      }
      console.log(
        `[Pipeline] Script ready — ${script.sections?.length ?? 0} sections`,
      );

      if (format === "reddit_story") {
        // ── 2. TTS Voiceover ──────────────────────────────────────────────
        await db
          .from("video_queue")
          .update({
            status: "generating_voice",
            updated_at: new Date().toISOString(),
          })
          .eq("id", recordId);

        const narrationText = [
          script.hook ?? "",
          ...(script.sections ?? []).map((s: any) => s.narration ?? ""),
          script.outro ?? "",
        ]
          .filter(Boolean)
          .join("\n\n");

        const hookWordCount = (script.hook ?? "")
          .trim()
          .split(/\s+/)
          .filter(Boolean).length;
        let hookDurationSec = 0;

        console.log(
          `[Pipeline] Generating voiceover — ${narrationText.length} chars`,
        );
        const audioBuffer = await generateVoiceover(narrationText);
        fs.writeFileSync(rawMp3Path, audioBuffer);
        console.log(`[Pipeline] Raw voiceover written: ${rawMp3Path}`);

        // Speed up the voiceover to 1.25x tempo
        await speedUpAudio(rawMp3Path, mp3Path, 1.25);
        cleanupFiles(rawMp3Path);
        console.log(`[Pipeline] Sped-up voiceover written: ${mp3Path}`);

        // ── 3. Measure audio duration ─────────────────────────────────────
        const durationSec = await getAudioDuration(mp3Path);

        // ── 4. Compositing ────────────────────────────────────────────────
        await db
          .from("video_queue")
          .update({
            status: "compositing",
            updated_at: new Date().toISOString(),
          })
          .eq("id", recordId);

        const background = getDefaultBackground(format);
        if (!background?.exists || !background.absolutePath) {
          throw new Error(
            "No background video file found on disk. Add a file at backgrounds/reddit/minecraft-parkour.mp4",
          );
        }

        // Generate Reddit Card overlay (SVG → PNG)
        let overlayPngPath: string | undefined = undefined;
        {
          const svgPath = path.join(tempDir, `${recordId}_card.svg`);
          overlayPngPath = path.join(tempDir, `${recordId}_card.png`);
          console.log(
            "[DEBUG:PIPELINE] redditConfig received:",
            JSON.stringify(redditConfig, null, 2),
          );
          const resolvedRedditConfig = redditConfig
            ? resolveRedditCardConfig(redditConfig)
            : resolveRedditCardConfig(buildRedditCardConfig(script));
          console.log(
            "[DEBUG:PIPELINE] resolvedRedditConfig:",
            JSON.stringify(resolvedRedditConfig, null, 2),
          );
          console.log(
            "[DEBUG:PIPELINE] overlay.marginTop in resolved:",
            resolvedRedditConfig?.overlay?.marginTop,
          );
          await generateRedditCardSvg(resolvedRedditConfig, overlayPngPath);
          // svgToPng no longer needed — cardSatori renders PNG directly
        }

        // Generate Captions ASS file using Polly Speech Marks
        let subtitlePath: string | undefined = undefined;
        try {
          console.log(`[Pipeline] Fetching Polly speech marks for captions...`);
          const speechMarksNdJson = await generateSpeechMarks(narrationText);

          const words: { time: number; value: string }[] = [];
          for (const line of speechMarksNdJson.trim().split("\n")) {
            if (!line) continue;
            try {
              const obj = JSON.parse(line);
              if (obj.type === "word") {
                // scale down the time by 1.25 because the audio is sped up by 1.25x
                words.push({
                  time: obj.time / 1.25,
                  value: obj.value,
                });
              }
            } catch (err) {
              console.warn("[Pipeline] Failed to parse speech mark line:", err);
            }
          }

          if (words.length > 0) {
            if (hookWordCount > 0) {
              const lastHookWordIndex = Math.min(
                hookWordCount - 1,
                words.length - 1,
              );
              hookDurationSec = words[lastHookWordIndex].time / 1000;
              console.log(
                `[Pipeline] Calculated hook duration: ${hookDurationSec.toFixed(2)}s (index ${lastHookWordIndex})`,
              );
            }

            const formatAssTime = (ms: number): string => {
              const hours = Math.floor(ms / 3600000);
              const minutes = Math.floor((ms % 3600000) / 60000);
              const seconds = Math.floor((ms % 60000) / 1000);
              const centiseconds = Math.floor((ms % 1000) / 10);

              const pad = (num: number, size: number) => {
                let s = num + "";
                while (s.length < size) s = "0" + s;
                return s;
              };

              return `${hours}:${pad(minutes, 2)}:${pad(seconds, 2)}.${pad(centiseconds, 2)}`;
            };

            console.log(
              "[DEBUG:PIPELINE] Caption fields for ASS:",
              JSON.stringify(
                {
                  captionColor,
                  captionOutlineEnabled,
                  captionOutlineWidth,
                  textPlacement,
                  captionAnimation,
                  captionExit,
                },
                null,
                2,
              ),
            );

            // Build ASS style from effects settings
            const hexToAssColor = (hex: string): string => {
              // Convert "#RRGGBB" to ASS "&H00BBGGRR"
              const c = hex.replace("#", "");
              const r = c.slice(0, 2);
              const g = c.slice(2, 4);
              const b = c.slice(4, 6);
              return `&H00${b}${g}${r}`;
            };

            const textColor = captionColor
              ? hexToAssColor(captionColor)
              : "&H00FFFFFF";
            const outlineThickness =
              captionOutlineEnabled && captionOutlineWidth
                ? Math.round(captionOutlineWidth * 2.5)
                : 0;
            const outlineColor = captionOutlineEnabled
              ? "&H00000000"
              : "&H00FFFFFF";
            // ASS alignment: 2=bottom center, 5=center, 8=top center
            const assAlignment =
              textPlacement === "top" ? 8 : textPlacement === "bottom" ? 2 : 5;

            const assLines: string[] = [
              `[Script Info]`,
              `ScriptType: v4.00+`,
              `PlayResX: 1080`,
              `PlayResY: 1920`,
              `WrapStyle: 0`,
              ``,
              `[V4+ Styles]`,
              `Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding`,
              `Style: Default,Impact,100,${textColor},&H000000FF,${outlineColor},&H00000000,-1,0,0,0,100,100,0,0,1,${outlineThickness},0,${assAlignment},0,0,0,1`,
              ``,
              `[Events]`,
              `Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text`,
            ];

            // Build ASS animation tags based on effects
            // ASS timing units: \fad uses milliseconds, \move and \t use CENTISECONDS
            const FAD_MS = 250; // ms for \fad
            const MOVE_CS = 25; // cs for \move and \t (250ms = 25cs)

            /** Build the ASS override tags for entrance animation */
            const getEntranceTag = (): string => {
              switch (captionAnimation) {
                case "fade":
                  return `{\\fad(${FAD_MS},0)}`;
                case "slide":
                  return `{\\move(840,0,540,0,0,${MOVE_CS})}`;
                case "pop-out":
                  return `{\\fscx130\\fscy130\\t(0,${MOVE_CS},\\fscx100\\fscy100)}`;
                default:
                  return ""; // linear — no animation
              }
            };

            /** Build the ASS override tags for exit animation */
            const getExitTag = (): string => {
              switch (captionExit) {
                case "fade":
                  return `{\\fad(0,${FAD_MS})}`;
                case "slide-down":
                  return `{\\move(540,0,540,40,0,${MOVE_CS})}`;
                case "scale-down":
                  return `{\\t(0,${MOVE_CS},\\fscx10\\fscy10)}`;
                default:
                  return ""; // "none" — no animation
              }
            };

            const entranceTag = getEntranceTag();
            const exitTag = getExitTag();
            // Combine tags: entrance prelude + exit suffix
            const animPrelude = entranceTag || "";
            const animSuffix = exitTag || "";

            const wordsPerCaption = 1;

            for (let i = 0; i < words.length; i += wordsPerCaption) {
              const chunk = words.slice(i, i + wordsPerCaption);
              if (chunk.length === 0) continue;

              const startTimeMs = chunk[0].time;
              const nextChunkStart = words[i + wordsPerCaption]?.time;

              let endTimeMs: number;
              if (nextChunkStart) {
                const gap = nextChunkStart - startTimeMs;
                if (gap > 600) {
                  endTimeMs = startTimeMs + 450;
                } else {
                  endTimeMs = nextChunkStart - 20;
                }
              } else {
                endTimeMs = startTimeMs + 400;
              }

              // For exit animations, animate in the last MOVE_CS centiseconds of the line
              const totalMs = endTimeMs - startTimeMs;
              const totalCs = Math.floor(totalMs / 10);
              let exitTagTimed = "";
              if (captionExit === "slide-down") {
                const animStart = Math.max(0, totalCs - MOVE_CS);
                exitTagTimed = `{\\move(540,0,540,40,${animStart},${totalCs})}`;
              } else if (captionExit === "scale-down") {
                const animStart = Math.max(0, totalCs - MOVE_CS);
                exitTagTimed = `{\\t(${animStart},${totalCs},\\fscx10\\fscy10)}`;
              } else {
                exitTagTimed = animSuffix; // \fad works regardless of timing
              }

              const captionText = chunk
                .map((w) => w.value)
                .join(" ")
                .toUpperCase();
              assLines.push(
                `Dialogue: 0,${formatAssTime(startTimeMs)},${formatAssTime(endTimeMs)},Default,,0,0,0,,${animPrelude}${captionText}${exitTagTimed}`,
              );
            }

            subtitlePath = path.join(tempDir, `${recordId}_subtitles.ass`);
            fs.writeFileSync(subtitlePath, assLines.join("\n"));
            console.log(`[Pipeline] Captions ASS written to: ${subtitlePath}`);
          }
        } catch (subError) {
          console.error(
            "[Pipeline] Subtitle generation failed, proceeding without captions:",
            subError,
          );
        }

        await trimVideoToAudio(
          background.absolutePath,
          bgTrimPath,
          durationSec,
        );
        await mergeAudioVideo(
          bgTrimPath,
          mp3Path,
          finalPath,
          overlayPngPath,
          subtitlePath,
          hookDurationSec,
        );

        // ── 5. Cleanup intermediates (keep final for preview only if R2 upload fails) ─────────────
        const filesToCleanup = [mp3Path, bgTrimPath];
        if (overlayPngPath) filesToCleanup.push(overlayPngPath);
        if (subtitlePath) filesToCleanup.push(subtitlePath);
        cleanupFiles(...filesToCleanup);

        // ── 6. Upload compiled MP4 to Cloudflare R2 ───────────────────────
        let r2UrlToStore = `local://${recordId}_final.mp4`;
        let thumbnailUrl: string | null = null;
        try {
          const { uploadVideo } = await import("../utils/r2");
          if (fs.existsSync(finalPath)) {
            const r2Url = await uploadVideo(finalPath, recordId);
            r2UrlToStore = r2Url;
            console.log(`[Pipeline] Uploaded to R2 successfully: ${r2Url}`);

            // ── Extract and upload thumbnail (first frame) ──────────────
            const thumbnailPath = path.join(tempDir, `${recordId}_thumb.jpg`);
            try {
              const { extractFirstFrame } = await import("./ffmpegService");
              const { uploadToR2 } = await import("../utils/r2");
              await extractFirstFrame(finalPath, thumbnailPath);
              if (fs.existsSync(thumbnailPath)) {
                const thumbBuffer = fs.readFileSync(thumbnailPath);
                const thumbFileName = `${userId}-${recordId}-thumb.jpg`;
                console.log(
                  `[Pipeline] Uploading thumbnail to R2: ${thumbFileName}`,
                );
                const thumbUrl = await uploadToR2(
                  thumbFileName,
                  thumbBuffer,
                  "image/jpeg",
                );
                if (thumbUrl) {
                  thumbnailUrl = thumbUrl;
                  console.log(`[Pipeline] Thumbnail uploaded: ${thumbUrl}`);
                }
                fs.unlinkSync(thumbnailPath);
              }
            } catch (thumbErr) {
              console.error(
                `[Pipeline] Thumbnail extraction/upload failed:`,
                thumbErr,
              );
            }

            // ── 6b. Auto-upload to YouTube if requested ──────────────────
            if (autoUpload && ytRefreshToken && fs.existsSync(finalPath)) {
              try {
                const { uploadVideo, CATEGORY_MAP } =
                  await import("./youtubeService");
                const { getUserWebhookUrl, sendDiscordAlert } =
                  await import("./discordWebhook");

                // Fetch user's video settings for upload options
                let uploadOptions: any = { privacyStatus: "private" };
                const { data: settings } = await supabase
                  .from("user_usage")
                  .select("video_settings")
                  .eq("user_id", userId)
                  .maybeSingle();

                if (settings?.video_settings) {
                  const vs = settings.video_settings;
                  uploadOptions.privacyStatus = vs.privacy || "private";
                  uploadOptions.categoryId =
                    CATEGORY_MAP[vs.category] || undefined;
                  uploadOptions.defaultLanguage = vs.language || undefined;

                  // Build description from template
                  const descTemplate = vs.description || "";
                  if (descTemplate) {
                    uploadOptions.description = descTemplate.replace(
                      /{title}/g,
                      title,
                    );
                  }
                }

                const finalDesc =
                  uploadOptions.description || description || title;

                console.log(
                  `[Pipeline] Auto-uploading "${title}" to YouTube...`,
                );
                const result = await uploadVideo(
                  finalPath,
                  title,
                  finalDesc,
                  ytRefreshToken,
                  uploadOptions,
                );
                console.log(
                  `[Pipeline] YouTube upload complete: ${result.videoUrl}`,
                );

                // Update the queue record with YouTube info
                await supabase
                  .from("video_queue")
                  .update({
                    yt_video_id: result.videoId,
                    yt_video_url: result.videoUrl,
                    updated_at: new Date().toISOString(),
                  })
                  .eq("id", recordId);

                // Send success notification
                const webhookUrl = await getUserWebhookUrl(supabase, userId);
                await sendDiscordAlert(webhookUrl, {
                  title: `📤 Auto-Published: ${title}`,
                  message: `Video was automatically uploaded to YouTube.`,
                  type: "success",
                  jobId: recordId,
                  fields: [
                    {
                      name: "YouTube URL",
                      value: result.videoUrl,
                      inline: false,
                    },
                  ],
                }).catch(() => {});
              } catch (ytErr: any) {
                console.error(
                  `[Pipeline] Auto-upload to YouTube failed:`,
                  ytErr,
                );
                // Send failure notification but don't fail the pipeline
                try {
                  const { getUserWebhookUrl, sendDiscordAlert } =
                    await import("./discordWebhook");
                  const webhookUrl = await getUserWebhookUrl(supabase, userId);
                  await sendDiscordAlert(webhookUrl, {
                    title: `YouTube Upload Failed: ${title}`,
                    message:
                      ytErr?.message || "Unknown error during auto-upload",
                    type: "failure",
                    jobId: recordId,
                  }).catch(() => {});
                } catch {}
              }
            }

            // Delete local compiled file to save server space
            try {
              fs.unlinkSync(finalPath);
              console.log(
                `[Pipeline] Deleted local final compiled file: ${finalPath}`,
              );
            } catch (unlinkErr) {
              console.error(
                `[Pipeline] Could not delete local finalPath:`,
                unlinkErr,
              );
            }
          } else {
            console.warn(`[Pipeline] Final video path not found: ${finalPath}`);
          }
        } catch (r2UploadErr: any) {
          console.error(
            `[Pipeline] R2 upload failed, falling back to local storage:`,
            r2UploadErr,
          );
        }

        await db
          .from("video_queue")
          .update({
            status: "completed",
            r2_url: r2UrlToStore,
            posted_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", recordId);

        // Best-effort: store thumbnail_url separately (column may not exist yet)
        if (thumbnailUrl) {
          try {
            await db
              .from("video_queue")
              .update({
                thumbnail_url: thumbnailUrl,
                updated_at: new Date().toISOString(),
              })
              .eq("id", recordId);
          } catch (thumbDbErr) {
            console.error(
              "[Pipeline] Could not store thumbnail_url (column may not exist):",
              thumbDbErr,
            );
          }
        }

        console.log(
          `[Pipeline] ✅ Reddit story complete for "${title}" — preview at ${r2UrlToStore}`,
        );
      } else {
        // ── pov_slideshow: existing image-based flow ───────────────────────
        console.log(
          `[Pipeline] Generating ${script.sections.length} images...`,
        );
        const images = await generateImagesForScript(script, format, {
          uploadToR2: true,
          userId,
          jobId: recordId,
          style: voiceStyle,
        });

        const template = getTemplateForFormat(format);
        const background = getDefaultBackground(format);
        const renderPayload = {
          format,
          title,
          script,
          images: images.map(
            ({ sectionIndex, sectionLabel, r2Url, imagePrompt }) => ({
              sectionIndex,
              sectionLabel,
              r2Url,
              imagePrompt,
            }),
          ),
          template: template
            ? { id: template.id, label: template.label }
            : null,
          background: background
            ? {
                id: background.id,
                label: background.label,
                file: background.file,
                exists: background.exists,
              }
            : null,
        };

        // Placeholder until FFmpeg compositor for POV
        const mockVideoBuffer = Buffer.from(
          JSON.stringify(renderPayload, null, 2),
        );
        const { uploadToR2, deleteFromR2 } = await import("../utils/r2");
        const fileName = `${userId}-${Date.now()}.mp4`;
        const r2Url = await uploadToR2(
          fileName,
          mockVideoBuffer,
          "application/json",
        );

        await db
          .from("video_queue")
          .update({
            status: "completed",
            r2_url: r2Url,
            posted_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", recordId);

        console.log(`[Pipeline] ✅ POV pipeline complete for "${title}"`);
      }
    } catch (pipelineError: any) {
      console.error(`[Pipeline] ❌ Error:`, pipelineError);

      // Best-effort cleanup of any temp files
      cleanupFiles(mp3Path, bgTrimPath, finalPath, rawMp3Path);

      await db
        .from("video_queue")
        .update({
          status: "failed",
          r2_url: null,
          error_message: pipelineError.message ?? "Unknown error",
          updated_at: new Date().toISOString(),
        })
        .eq("id", recordId);

      // ── Send Discord alert if webhook is configured ────────────────
      try {
        const { getUserWebhookUrl, sendDiscordAlert } =
          await import("./discordWebhook");
        const webhookUrl = await getUserWebhookUrl(db, userId);
        await sendDiscordAlert(webhookUrl, {
          title: `Pipeline Failed: ${title}`,
          message: pipelineError.message ?? "Unknown error",
          type: "failure",
          stage:
            format === "reddit_story"
              ? "Reddit Story Pipeline"
              : "Slideshow Pipeline",
          jobId: recordId,
          fields: [
            {
              name: "Error",
              value: `\`\`\`${(pipelineError.message ?? "Unknown error").slice(0, 1000)}\`\`\``,
              inline: false,
            },
          ],
        });
      } catch (notifyErr) {
        console.error("[Pipeline] Discord notification error:", notifyErr);
      }
    } finally {
      releasePipelineSlot();
    }
  })();

  return { jobId: recordId };
};
