/**
 * Reddit card SVG → PNG renderer.
 *
 * Builds an SVG string that exactly matches RedditCard.tsx's layout
 * (left sidebar with votes, content area with avatar/header/title/body/actions).
 * No Satori, no JSX runtime — plain string template matching the React component.
 *
 * Render free tier compatible: no browser, pure string ops + sharp.
 */
import sharp from "sharp";

// ─── Public types ───────────────────────────────────────────────────────────

export type RedditTheme = "dark" | "light";
export type UpvoteState = "up" | "down" | "none";

export interface RedditCardConfig {
  username: string;
  subreddit: string;
  postTitle: string;
  postBody: string;
  upvotes: number;
  comments: number;
  timeAgo: string;
  theme: RedditTheme;
  showVerified: boolean;
  showAwards: boolean;
  avatarSrc: string;
  upvoteState: UpvoteState;
}

// ─── Utilities ──────────────────────────────────────────────────────────────

function esc(str: string): string {
  let cleaned = str;
  while (/\\"/.test(cleaned) || /\\'/.test(cleaned)) {
    cleaned = cleaned.replace(/\\"/g, '"').replace(/\\'/g, "'");
  }
  return cleaned
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function fmt(n: number): string {
  if (n >= 1_000_000)
    return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}m`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, "")}k`;
  return String(n);
}

function wrapText(
  text: string,
  maxWidthPx: number,
  avgCharPx: number,
): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    if (word.length * avgCharPx > maxWidthPx && !current) {
      const maxChars = Math.max(1, Math.floor(maxWidthPx / avgCharPx) - 1);
      lines.push(`${word.slice(0, maxChars)}…`);
      continue;
    }
    const test = current ? `${current} ${word}` : word;
    if (test.length * avgCharPx > maxWidthPx && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}

// ─── SVG Icons ──────────────────────────────────────────────────────────────

function upvoteSvg(color: string, fill: string): string {
  return `<svg width="20" height="20" viewBox="0 0 24 24" fill="${fill}" stroke="${color}" stroke-width="2"><path d="M12 4l8 8H4z"/></svg>`;
}
function downvoteSvg(color: string, fill: string): string {
  return `<svg width="20" height="20" viewBox="0 0 24 24" fill="${fill}" stroke="${color}" stroke-width="2"><path d="M12 20l-8-8h16z"/></svg>`;
}
function commentSvg(color: string): string {
  return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`;
}
function shareSvg(color: string): string {
  return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>`;
}
function awardSvg(color: string): string {
  return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg>`;
}

// ─── Main render function ───────────────────────────────────────────────────

export interface CardRenderOptions {
  width: number;
  height: number;
}

export async function renderCardToPng(
  config: RedditCardConfig,
  options: CardRenderOptions,
): Promise<Buffer> {
  const isDark = config.theme === "dark";
  const bg = isDark ? "#1a1a1b" : "#ffffff";
  const border = isDark ? "#343536" : "#ccc";
  const textMain = isDark ? "#d7dadc" : "#1c1c1c";
  const textSub = isDark ? "#818384" : "#878a8c";
  const bgInner = isDark ? "#272729" : "#f6f7f8";
  const orange = "#ff4500";

  const displayUpvotes =
    config.upvoteState === "up"
      ? config.upvotes + 1
      : config.upvoteState === "down"
        ? config.upvotes - 1
        : config.upvotes;

  const upvoteColor =
    config.upvoteState === "up"
      ? orange
      : config.upvoteState === "down"
        ? "#7193ff"
        : textSub;

  const upvoteFill = config.upvoteState === "up" ? upvoteColor : "none";
  const downvoteFill = config.upvoteState === "down" ? "#7193ff" : "none";

  const W = options.width; // 540
  const SIDEBAR_W = 40;
  const CONTENT_X = SIDEBAR_W;
  const CONTENT_W = W - CONTENT_X - 8; // 8px right padding
  const PAD_LEFT = 8;
  const PAD_TOP = 8;
  const X = CONTENT_X + PAD_LEFT;
  const innerW = CONTENT_W - PAD_LEFT;

  const avatarSize = 20;
  const headerGap = 6;
  const headerFont = 12;
  const titleFont = 18;
  const titleLineH = 24;
  const bodyFont = 14;
  const bodyLineH = 22;
  const actionFont = 12;
  const actionH = 28;

  // Header
  const avatarY = PAD_TOP + 2;
  const headerTextY = PAD_TOP + headerFont + 4;
  let yCursor = PAD_TOP;

  // Title (wrap if needed)
  const titleLines = wrapText(
    config.postTitle || "Your post title goes here",
    innerW,
    titleFont * 0.58,
  );
  const titleY = avatarY + avatarSize + 12;
  yCursor = titleY + titleLines.length * titleLineH + 6;

  // Body (wrap, max ~6 lines)
  const bodyLines = config.postBody
    ? wrapText(config.postBody, innerW, bodyFont * 0.56).slice(0, 6)
    : [];
  if (bodyLines.length > 0) {
    yCursor += 4; // margin before body
    yCursor += bodyLines.length * bodyLineH + 8;
  }

  // Awards
  if (config.showAwards) {
    yCursor += 4; // margin before awards
    yCursor += 22; // height of awards row + gap
  }

  // Actions row
  const actionsY = yCursor;
  yCursor += actionH + 8; // bottom padding

  const totalH = Math.max(yCursor, options.height);

  // ─── Build SVG ────────────────────────────────────────────────────────

  const lines: string[] = [];
  const push = (s: string) => lines.push(s);

  push(`<?xml version="1.0" encoding="UTF-8"?>`);
  push(
    `<svg width="${W}" height="${totalH}" viewBox="0 0 ${W} ${totalH}" xmlns="http://www.w3.org/2000/svg">`,
  );
  push(`<style>
    text { font-family: 'IBM Plex Sans', -apple-system, BlinkMacSystemFont, sans-serif; }
  </style>`);

  // Card background
  push(
    `<rect x="0" y="0" width="${W}" height="${totalH}" rx="4" fill="${bg}" stroke="${border}" stroke-width="1"/>`,
  );

  // Left sidebar background
  push(
    `<rect x="0" y="0" width="${SIDEBAR_W}" height="${totalH}" fill="${bgInner}"/>`,
  );

  // ── Left sidebar content ──

  // Upvote arrow
  const sidebarCenterX = SIDEBAR_W / 2;
  push(
    `<g transform="translate(${sidebarCenterX - 10}, 8)">${upvoteSvg(upvoteColor, upvoteFill)}</g>`,
  );
  // Vote count
  push(
    `<text x="${sidebarCenterX}" y="52" font-size="12" font-weight="700" fill="${upvoteColor}" text-anchor="middle">${esc(fmt(displayUpvotes))}</text>`,
  );
  // Downvote arrow
  push(
    `<g transform="translate(${sidebarCenterX - 10}, 56)">${downvoteSvg(config.upvoteState === "down" ? "#7193ff" : textSub, downvoteFill)}</g>`,
  );

  // ── Main content ──

  // Avatar (circle with "R" fallback)
  push(
    `<circle cx="${X + avatarSize / 2}" cy="${avatarY + avatarSize / 2}" r="${avatarSize / 2}" fill="#FF4500"/>`,
  );
  push(
    `<text x="${X + avatarSize / 2}" y="${avatarY + avatarSize / 2 + 4}" font-size="10" fill="white" font-weight="700" text-anchor="middle">R</text>`,
  );

  // Header text: r/subreddit • Posted by u/username • time
  const headerStr = `r/${esc(config.subreddit || "AskReddit")} • Posted by u/${esc(config.username || "anonymous")} • ${esc(config.timeAgo || "4 hours ago")}`;
  push(
    `<text x="${X + avatarSize + headerGap}" y="${headerTextY}" font-size="${headerFont}" fill="${textMain}">${headerStr}</text>`,
  );

  // Title
  for (let i = 0; i < titleLines.length; i++) {
    push(
      `<text x="${X}" y="${titleY + i * titleLineH}" font-size="${titleFont}" font-weight="700" fill="${textMain}">${esc(titleLines[i])}</text>`,
    );
  }

  // Body
  let bodyY = titleY + titleLines.length * titleLineH + 10;
  for (let i = 0; i < bodyLines.length; i++) {
    push(
      `<text x="${X}" y="${bodyY + i * bodyLineH}" font-size="${bodyFont}" fill="${textMain}">${esc(bodyLines[i])}</text>`,
    );
  }

  // Awards
  if (config.showAwards) {
    const awardY =
      bodyLines.length > 0
        ? bodyY + bodyLines.length * bodyLineH + 6
        : bodyY + 6;
    const emojis = ["🏆", "⭐", "🎖️", "💎", "🌟"];
    let ex = X;
    for (const emoji of emojis) {
      push(`<text x="${ex}" y="${awardY + 14}" font-size="14">${emoji}</text>`);
      ex += 22;
    }
    push(
      `<text x="${ex}" y="${awardY + 14}" font-size="12" fill="${textSub}" font-weight="600">342</text>`,
    );
  }

  // Action buttons
  const actY = actionsY + actionH / 2 + actionFont * 0.35;

  // Comment
  push(
    `<g transform="translate(${X}, ${actionsY + (actionH - 16) / 2})">${commentSvg(textSub)}</g>`,
  );
  push(
    `<text x="${X + 20}" y="${actY}" font-size="${actionFont}" font-weight="700" fill="${textSub}">${fmt(config.comments)} Comments</text>`,
  );

  // Share
  const shareX =
    X +
    20 +
    estimateTextWidth(`${fmt(config.comments)} Comments`, actionFont, 0.58) +
    12;
  push(
    `<g transform="translate(${shareX}, ${actionsY + (actionH - 16) / 2})">${shareSvg(textSub)}</g>`,
  );
  push(
    `<text x="${shareX + 20}" y="${actY}" font-size="${actionFont}" font-weight="700" fill="${textSub}">Share</text>`,
  );

  // Award
  const awardBtnX =
    shareX + 20 + estimateTextWidth("Share", actionFont, 0.58) + 12;
  push(
    `<g transform="translate(${awardBtnX}, ${actionsY + (actionH - 16) / 2})">${awardSvg(textSub)}</g>`,
  );
  push(
    `<text x="${awardBtnX + 20}" y="${actY}" font-size="${actionFont}" font-weight="700" fill="${textSub}">Award</text>`,
  );

  push(`</svg>`);

  const svgStr = lines.join("\n");

  // Convert SVG to PNG via sharp
  const pngBuffer = await sharp(Buffer.from(svgStr))
    .resize(W * 2, totalH * 2, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();

  return pngBuffer;
}

function estimateTextWidth(
  text: string,
  fontSize: number,
  ratio: number,
): number {
  return Math.max(fontSize, text.length * fontSize * ratio);
}
