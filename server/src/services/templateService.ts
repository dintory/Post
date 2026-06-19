import fs from "fs";
import path from "path";
import type { VideoFormat } from "../types/video";
import type { GeneratedScript } from "./scriptGenerator";

export interface RedditRuntimeConfig extends Record<string, unknown> {
  overlay?: {
    position?: string;
    width?: number;
    scale?: number;
    marginTop?: number;
  };
}

const TEMPLATES_DIR = path.join(__dirname, "../../templates");

export interface VideoTemplateMeta {
  id: string;
  format: VideoFormat;
  label: string;
  description: string;
  component: string | null;
  configFile: string;
  usesBackgroundVideo: boolean;
}

export interface RedditTemplateConfig {
  id: string;
  format: VideoFormat;
  overlay: {
    position: string;
    width: number;
    scale: number;
    marginTop: number;
  };
  scriptFieldMapping: Record<string, keyof GeneratedScript | string>;
  defaults: Record<string, unknown>;
  randomize?: Record<string, unknown>;
}

export const listTemplates = (): VideoTemplateMeta[] => {
  const index = JSON.parse(
    fs.readFileSync(path.join(TEMPLATES_DIR, "index.json"), "utf-8"),
  );
  return index.templates;
};

export const getTemplateForFormat = (
  format: VideoFormat,
): VideoTemplateMeta | undefined =>
  listTemplates().find((t) => t.format === format);

export const loadTemplateConfig = <T = Record<string, unknown>>(
  templateId: string,
): T => {
  const template = listTemplates().find((t) => t.id === templateId);
  if (!template) throw new Error(`Template not found: ${templateId}`);

  const configPath = path.join(TEMPLATES_DIR, template.configFile);
  return JSON.parse(fs.readFileSync(configPath, "utf-8")) as T;
};

const pickRandom = <T>(arr: T[]): T =>
  arr[Math.floor(Math.random() * arr.length)];

export const buildRedditCardConfig = (
  script: GeneratedScript,
): Record<string, unknown> => {
  const config = loadTemplateConfig<RedditTemplateConfig>("reddit");
  const { defaults, scriptFieldMapping, randomize } = config;

  const result: Record<string, unknown> = {
    ...defaults,
    overlay: { ...config.overlay },
  };

  for (const [configKey, scriptKey] of Object.entries(scriptFieldMapping)) {
    const value = script[scriptKey as keyof GeneratedScript];
    if (typeof value === "string") {
      result[configKey] = value;
    }
  }

  if (randomize) {
    if (randomize.upvotes && typeof randomize.upvotes === "object") {
      const { min, max } = randomize.upvotes as { min: number; max: number };
      result.upvotes = Math.floor(Math.random() * (max - min + 1)) + min;
    }
    if (randomize.comments && typeof randomize.comments === "object") {
      const { min, max } = randomize.comments as { min: number; max: number };
      result.comments = Math.floor(Math.random() * (max - min + 1)) + min;
    }
    if (Array.isArray(randomize.timeAgo)) {
      result.timeAgo = pickRandom(randomize.timeAgo as string[]);
    }
  }

  // Use first section narration as body preview if hook is short
  if (!result.postBody && script.sections[0]?.narration) {
    result.postBody = script.sections[0].narration.slice(0, 280);
  }

  const subreddit = script.subreddit?.replace(/^r\//, "") ?? defaults.subreddit;
  result.subreddit = subreddit;

  return result;
};

export const resolveRedditCardConfig = (
  overrides?: RedditRuntimeConfig,
): RedditRuntimeConfig => {
  const config = loadTemplateConfig<RedditTemplateConfig>("reddit");
  const defaults = config.defaults as RedditRuntimeConfig;

  return {
    ...defaults,
    ...overrides,
    overlay: {
      ...config.overlay,
      ...(overrides?.overlay ?? {}),
    },
  };
};
