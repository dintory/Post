import { execFile } from "child_process";
import { promisify } from "util";
import fs from "fs";
import path from "path";
import os from "os";

const execFileAsync = promisify(execFile);

// ─── Memory-safe FFmpeg defaults ─────────────────────────────────────────
// Render free tier has 512MB RAM. FFmpeg with multiple threads can use 300MB+
// These flags keep peak memory under control:
//   -threads 1     : single thread only (no parallel frame buffers)
//   -preset ultrafast : minimal memory per frame
//   -crf 28        : smaller frames = less buffer memory
const THREADS = ["-threads", "1"];

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
  pitch: number = 1.12,
): Promise<void> => {
  console.log(`[FFmpeg] Processing audio: speed=${speed}, pitch=${pitch}`);
  await execFileAsync("ffmpeg", [
    ...THREADS,
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

  // Scale and crop to 1080×1920 (9:16 vertical, matches SVG overlay dimensions)
  await execFileAsync("ffmpeg", [
    ...THREADS,
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
    "28",
    "-preset",
    "ultrafast",
    "-an",
    "-y",
    outputPath,
  ]);

  console.log(`[FFmpeg] Trimmed background written to: ${outputPath}`);
};

// ─── Merge Trimmed Video + Voiceover Audio into Final MP4 ────────────────────

export const mergeAudioVideo = async (
  videoPath: string,
  audioPath: string,
  outputPath: string,
  overlayPath?: string,
  subtitlePath?: string,
  overlayDuration?: number,
): Promise<void> => {
  console.log(
    `[FFmpeg] Merging → ${outputPath} (overlay:${!!overlayPath} sub:${!!subtitlePath})`,
  );

  const args: string[] = [...THREADS];

  // ── Inputs ─────────────────────────────────────────────────────────────────
  args.push("-i", videoPath);

  if (overlayPath) {
    args.push("-loop", "1", "-i", overlayPath);
  }

  args.push("-i", audioPath);

  // ── Filter chain ───────────────────────────────────────────────────────────
  const audioIdx = overlayPath ? 2 : 1;
  let filterComplex: string;

  if (overlayPath && subtitlePath) {
    const escapedSub = subtitlePath.replace(/\\/g, "/").replace(/:/g, "\\:");
    let overlayFilter: string;
    if (overlayDuration && overlayDuration > 0) {
      overlayFilter = `[0:v][1:v]overlay=0:0:enable='lte(t,${overlayDuration.toFixed(3)})'[ov]`;
    } else {
      overlayFilter = `[0:v][1:v]overlay=0:0:shortest=1[ov]`;
    }
    filterComplex = `${overlayFilter};[ov]subtitles=${escapedSub}[outv]`;
  } else if (overlayPath) {
    if (overlayDuration && overlayDuration > 0) {
      filterComplex = `[0:v][1:v]overlay=0:0:enable='lte(t,${overlayDuration.toFixed(3)})'[outv]`;
    } else {
      filterComplex = `[0:v][1:v]overlay=0:0:shortest=1[outv]`;
    }
  } else if (subtitlePath) {
    const escapedSub = subtitlePath.replace(/\\/g, "/").replace(/:/g, "\\:");
    filterComplex = `[0:v]subtitles=${escapedSub}[outv]`;
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
    "28",
    "-preset",
    "ultrafast",
    "-c:a",
    "aac",
    "-b:a",
    "128k",
    "-shortest",
    "-movflags",
    "+faststart",
    "-y",
    outputPath,
  );

  await execFileAsync("ffmpeg", args);
  console.log(`[FFmpeg] Final MP4 written: ${outputPath}`);
};

// ─── Extract First Frame as JPEG Thumbnail (skipped if OOM risk) ────────────

export const extractFirstFrame = async (
  inputPath: string,
  outputPath: string,
): Promise<void> => {
  console.log(`[FFmpeg] Extracting first frame from: ${inputPath}`);
  await execFileAsync("ffmpeg", [
    ...THREADS,
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
