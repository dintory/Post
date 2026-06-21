import fs from "fs";
import sharp from "sharp";
import { generateRedditCardSvg as renderCardSvg } from "../shared/renderRedditCard";

// ─── Public Types (kept for backward compatibility) ─────────────────────────

export interface SvgCardOverlayConfig {
  position?: string;
  width?: number;
  scale?: number;
  /** Absolute card top Y in full-res frame px (sent by the client preview). */
  marginTop?: number;
  /** Absolute card top X in full-res frame px (sent by the client preview). */
  cardX?: number;
  /** Absolute card width in full-res frame px (sent by the client preview). */
  cardWidth?: number;
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
  cardWidthPercent?: number;
  showBody?: boolean;
}

// ─── SVG Generator (calls shared renderer, writes to disk) ──────────────────

export const generateRedditCardSvg = (
  config: SvgCardConfig,
  outputPath: string,
  base64Regular?: string,
  base64Bold?: string,
): void => {
  const W = 1080;
  const H = 1920;
  const overlay = config.overlay || {};
  // Prefer absolute coordinates sent by the client preview (1:1 match);
  // fall back to deriving width/X from cardWidthPercent.
  const cardWidth =
    overlay.cardWidth ??
    Math.round(W * ((config.cardWidthPercent ?? 52) / 100));
  const cardX = overlay.cardX ?? Math.round((W - cardWidth) / 2);
  const cardY = Math.round(overlay.marginTop ?? 54);

  const svg = renderCardSvg(
    {
      subreddit: config.subreddit,
      username: config.username,
      timeAgo: config.timeAgo,
      postTitle: config.postTitle,
      postBody: config.postBody,
      showBody: config.showBody,
      upvotes: config.upvotes,
      comments: config.comments,
      showAwards: config.showAwards,
      avatarSrc: config.avatarSrc,
      cardY,
    },
    {
      width: W,
      height: H,
      cardX,
      cardWidth,
      base64Regular,
      base64Bold,
    },
  );

  fs.writeFileSync(outputPath, svg);
  console.log(`[SVG Service] Reddit card written → ${outputPath}`);
};

// ─── SVG → PNG conversion ──────────────────────────────────────────────────

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
