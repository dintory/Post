import { execFile } from "child_process";
import { promisify } from "util";
import fs from "fs";
import path from "path";
import os from "os";

const execFileAsync = promisify(execFile);

// ─── Temp Directory ──────────────────────────────────────────────────────────

export const getTempDir = (): string => {
  const dir = path.join(os.tmpdir(), "commissioner");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
};

// ─── Speed Up Audio with atempo ──────────────────────────────────────────────

export const speedUpAudio = async (
  inputPath: string,
  outputPath: string,
  speed: number = 1.25,
  pitch: number = 1.12, // energetic higher pitch
): Promise<void> => {
  console.log(`[FFmpeg] Processing audio: speed=${speed}, pitch=${pitch}`);
  await execFileAsync("ffmpeg", [
    "-i",
    inputPath,
    "-filter:a",
    `rubberband=pitch=${pitch},atempo=${speed}`,
    "-y",
    outputPath,
  ]);
};

// ─── Audio Duration ──────────────────────────────────────────────────────────

export const getAudioDuration = async (audioPath: string): Promise<number> => {
  const { stdout } = await execFileAsync("ffprobe", [
    "-v",
    "quiet",
    "-print_format",
    "json",
    "-show_streams",
    audioPath,
  ]);

  const info = JSON.parse(stdout);
  const audioStream = info.streams?.find((s: any) => s.codec_type === "audio");
  const duration = parseFloat(audioStream?.duration ?? "0");

  if (!duration)
    throw new Error(
      `[FFmpeg] Could not read audio duration from: ${audioPath}`,
    );

  console.log(`[FFmpeg] Audio duration: ${duration.toFixed(2)}s`);
  return duration;
};

// ─── Trim Background Video to Audio Duration ─────────────────────────────────

export const trimVideoToAudio = async (
  inputPath: string,
  outputPath: string,
  durationSec: number,
): Promise<void> => {
  // Get background video duration so we can pick a random start offset
  const { stdout } = await execFileAsync("ffprobe", [
    "-v",
    "quiet",
    "-print_format",
    "json",
    "-show_streams",
    inputPath,
  ]);
  const info = JSON.parse(stdout);
  const videoStream = info.streams?.find((s: any) => s.codec_type === "video");
  const videoDuration = parseFloat(videoStream?.duration ?? "0");

  // Random start within first 50% of the video (ensuring enough footage remains)
  const maxStart = Math.max(0, videoDuration / 2 - durationSec);
  const startOffset = Math.random() * maxStart;

  console.log(
    `[FFmpeg] Trimming background — start: ${startOffset.toFixed(1)}s, duration: ${durationSec.toFixed(1)}s`,
  );

  // Scale and crop to 1080×1920 (9:16 vertical), strip any existing audio
  await execFileAsync("ffmpeg", [
    "-ss",
    String(startOffset.toFixed(3)),
    "-i",
    inputPath,
    "-t",
    String(durationSec.toFixed(3)),
    "-vf",
    "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920",
    "-c:v",
    "libx264",
    "-crf",
    "23",
    "-preset",
    "veryfast",
    "-an", // drop audio track from background
    "-y",
    outputPath,
  ]);

  console.log(`[FFmpeg] Trimmed background written to: ${outputPath}`);
};

// ─── Merge Trimmed Video + Voiceover Audio into Final MP4 ────────────────────

export const mergeAudioVideo = async (
  videoPath: string, // 1080×1920 trimmed background (no audio)
  audioPath: string, // MP3 voiceover
  outputPath: string, // final 1080×1920 MP4
  overlayPath?: string, // PNG card overlay (optional)
  subtitlePath?: string, // SRT or ASS subtitle file (optional)
  overlayDuration?: number, // duration of title/hook in seconds
): Promise<void> => {
  console.log(
    `[FFmpeg] Merging → ${outputPath} (overlay:${!!overlayPath} sub:${!!subtitlePath} duration:${overlayDuration})`,
  );

  const args: string[] = [];

  // ── Inputs ─────────────────────────────────────────────────────────────────
  // Background video
  args.push("-i", videoPath);

  // PNG overlay: use -loop 1 so the single frame lasts the full duration
  if (overlayPath) {
    args.push("-loop", "1", "-i", overlayPath);
  }

  // Voiceover audio (always last input)
  args.push("-i", audioPath);

  // ── Filter chain ───────────────────────────────────────────────────────────
  const audioIdx = overlayPath ? 2 : 1; // which input index is audio

  let filterComplex: string;

  if (overlayPath && subtitlePath) {
    // Escape Windows absolute path for libass: replace \ with / and escape : as \\:
    const escapedSub = subtitlePath.replace(/\\/g, "/").replace(/:/g, "\\:");
    let overlayFilter: string;
    if (overlayDuration && overlayDuration > 0) {
      overlayFilter = `[0:v][1:v]overlay=0:0:enable='lte(t,${overlayDuration.toFixed(3)})'[ov]`;
    } else {
      overlayFilter = `[0:v][1:v]overlay=0:0:shortest=1[ov]`;
    }
    filterComplex = `${overlayFilter};` + `[ov]subtitles='${escapedSub}'[outv]`;
  } else if (overlayPath) {
    if (overlayDuration && overlayDuration > 0) {
      filterComplex = `[0:v][1:v]overlay=0:0:enable='lte(t,${overlayDuration.toFixed(3)})'[outv]`;
    } else {
      filterComplex = `[0:v][1:v]overlay=0:0:shortest=1[outv]`;
    }
  } else if (subtitlePath) {
    const escapedSub = subtitlePath.replace(/\\/g, "/").replace(/:/g, "\\:");
    filterComplex = `[0:v]subtitles='${escapedSub}'[outv]`;
  } else {
    filterComplex = "";
  }

  if (filterComplex) {
    args.push("-filter_complex", filterComplex, "-map", "[outv]");
  } else {
    args.push("-map", "0:v:0");
  }

  args.push(
    "-map",
    `${audioIdx}:a:0`,
    "-c:v",
    filterComplex ? "libx264" : "copy",
    "-crf",
    "23",
    "-preset",
    "veryfast",
    "-c:a",
    "aac",
    "-b:a",
    "192k",
    "-shortest",
    "-movflags",
    "+faststart",
    "-y",
    outputPath,
  );

  await execFileAsync("ffmpeg", args);
  console.log(`[FFmpeg] Final MP4 written: ${outputPath}`);
};

// ─── Extract First Frame as JPEG Thumbnail ──────────────────────────────────

export const extractFirstFrame = async (
  inputPath: string,
  outputPath: string,
): Promise<void> => {
  console.log(`[FFmpeg] Extracting first frame from: ${inputPath}`);
  await execFileAsync("ffmpeg", [
    "-i",
    inputPath,
    "-vframes",
    "1",
    "-q:v",
    "2",
    "-y",
    outputPath,
  ]);
  console.log(`[FFmpeg] Thumbnail written: ${outputPath}`);
};

// ─── Temp File Cleanup ────────────────────────────────────────────────────────

export const cleanupFiles = (...filePaths: string[]): void => {
  for (const p of filePaths) {
    try {
      if (fs.existsSync(p)) {
        fs.unlinkSync(p);
        console.log(`[FFmpeg] Deleted temp file: ${p}`);
      }
    } catch (err) {
      console.warn(`[FFmpeg] Could not delete ${p}:`, err);
    }
  }
};
