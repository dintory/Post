import fs from "fs";
import sharp from "sharp";
import { getCardLayout } from "../shared/layoutEngine";
import { renderCardToPng, type RedditCardConfig } from "./cardSatori";

// ─── Public Types (kept for backward compatibility) ─────────────────────────

export interface SvgCardOverlayConfig {
  position?: string;
  width?: number;
  scale?: number;
  marginTop?: number;
}

export interface SvgCardConfig {
  subreddit?: string;
  username?: string;
  postTitle?: string;
  postBody?: string;
  upvotes?: number;
  comments?: number;
  timeAgo?: string;
  showVerified?: boolean;
  showAwards?: boolean;
  avatarSrc?: string;
  overlay?: SvgCardOverlayConfig;
}

// ─── Card PNG Generator (uses Satori to render RedditCard.tsx identically) ──

export const generateRedditCardSvg = async (
  config: SvgCardConfig,
  outputPath: string,
): Promise<void> => {
  // RedditCard.tsx is 540px wide — render at that size for sharp overlay
  const cardPng = await renderCardToPng(
    {
      username: config.username ?? "throwaway_8472",
      subreddit: config.subreddit ?? "AskReddit",
      postTitle: config.postTitle ?? "Your post title goes here",
      postBody: config.postBody ?? "",
      upvotes: config.upvotes ?? 99,
      comments: config.comments ?? 99,
      timeAgo: config.timeAgo ?? "6 hours ago",
      theme: "dark",
      showVerified: config.showVerified ?? false,
      showAwards: config.showAwards ?? false,
      avatarSrc: config.avatarSrc ?? "",
      upvoteState: "none",
    },
    { width: 540, height: 600 },
  );

  // Scale from 540px card width to the overlay size in the 1080 frame
  const W = 1080;
  const H = 1920;
  const { width: cardWidth } = getCardLayout({ width: W, height: H }, "top", 0);
  const scale = cardWidth / 540;

  // Resize the 540px card PNG to the actual overlay dimensions via sharp
  const overlayWidth = Math.round(540 * scale);
  const overlayHeight = Math.round(600 * scale);

  await sharp(cardPng)
    .resize(overlayWidth, overlayHeight, {
      fit: "fill",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toFile(outputPath);

  console.log(`[SVG Service] Reddit card PNG written → ${outputPath}`);
};

// ─── SVG → PNG conversion (kept for callers that still use it) ──────────────

export const svgToPng = async (
  svgPath: string,
  pngPath: string,
): Promise<void> => {
  await sharp(svgPath)
    .resize(1080, 1920, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toFile(pngPath);
  console.log(`[PNG] Saved to ${pngPath}`);
};
