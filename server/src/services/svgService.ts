import fs from "fs";
import sharp from "sharp";
import { generateRedditCardSvg as renderCardSvg } from "../shared/renderRedditCard";

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
  const pct = config.cardWidthPercent ?? 52;
  const cardWidth = Math.round(W * (pct / 100));
  const cardX = Math.round((W - cardWidth) / 2);

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
      cardY: Math.round(config.overlay?.marginTop ?? 54),
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
