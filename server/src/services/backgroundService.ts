import fs from "fs";
import path from "path";
import type { VideoFormat } from "../types/video";

const BACKGROUNDS_DIR = path.join(__dirname, "../../backgrounds");

export interface BackgroundVideo {
  id: string;
  format: VideoFormat;
  label: string;
  file: string;
  tags: string[];
  default?: boolean;
  exists?: boolean;
  absolutePath?: string;
}

export const listBackgrounds = (format?: VideoFormat): BackgroundVideo[] => {
  const index = JSON.parse(
    fs.readFileSync(path.join(BACKGROUNDS_DIR, "index.json"), "utf-8"),
  );

  return (index.backgrounds as BackgroundVideo[])
    .filter((bg) => !format || bg.format === format)
    .map((bg) => {
      const absolutePath = path.join(BACKGROUNDS_DIR, bg.file);
      return {
        ...bg,
        exists: fs.existsSync(absolutePath),
        absolutePath,
      };
    });
};

export const getDefaultBackground = (
  format: VideoFormat,
): BackgroundVideo | undefined => {
  const backgrounds = listBackgrounds(format);
  return (
    backgrounds.find((b) => b.default) ??
    backgrounds.find((b) => b.exists) ??
    backgrounds[0]
  );
};

export const getBackgroundById = (id: string): BackgroundVideo | undefined =>
  listBackgrounds().find((b) => b.id === id);
