import fs from "fs";
import sharp from "sharp";

function esc(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function trimTrailingZero(value: string): string {
  return value.endsWith(".0") ? value.slice(0, -2) : value;
}

function formatCompactCount(n: number): string {
  if (n >= 1_000_000) return `${trimTrailingZero((n / 1_000_000).toFixed(1))}m`;
  if (n >= 1_000) return `${trimTrailingZero((n / 1_000).toFixed(1))}k`;
  if (n >= 100) return "99+";
  return String(Math.max(0, Math.round(n)));
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

function clampLines(
  text: string,
  maxWidthPx: number,
  avgCharPx: number,
  maxLines: number,
): string[] {
  const wrapped = wrapText(text, maxWidthPx, avgCharPx);
  if (wrapped.length <= maxLines) return wrapped;

  const result = wrapped.slice(0, maxLines);
  const maxChars = Math.max(1, Math.floor(maxWidthPx / avgCharPx) - 1);
  const lastLine = result[maxLines - 1] ?? "";
  const shortened =
    lastLine.length > maxChars ? lastLine.slice(0, maxChars) : lastLine;
  result[maxLines - 1] = `${shortened.replace(/[.,!?:;\s]+$/u, "")}…`;
  return result;
}

function withPrefix(value: string, prefix: string): string {
  return value.startsWith(prefix) ? value : `${prefix}${value}`;
}

function estimateTextWidth(
  text: string,
  fontSize: number,
  ratio: number,
): number {
  return Math.max(fontSize, text.length * fontSize * ratio);
}

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

function verifiedBadge(x: number, y: number, size = 12): string {
  const scale = size / 24;
  return `<g transform="translate(${x}, ${y - size + 1}) scale(${scale})">
    <path fill-rule="evenodd" clip-rule="evenodd"
      d="M12.5589 0.7267C12.9733 0.8474 13.3429 1.1642 14.082 1.7978L14.8782 2.4802C15.2109 2.7653
         15.3772 2.9079 15.5649 3.0095C15.7314 3.0996 15.9098 3.1656 16.0948 3.2055C16.3034 3.2505
         16.5225 3.2505 16.9607 3.2505H17.5495C18.6696 3.2505 19.2297 3.2505 19.6575 3.4685C20.0338
         3.6603 20.3398 3.9662 20.5315 4.3426C20.7495 4.7704 20.7495 5.3304 20.7495
         6.4505V7.0393C20.7495 7.4775 20.7495 7.6966 20.7945 7.9052C20.8345 8.0903 20.9005 8.2687
         20.9906 8.4351C21.0921 8.6228 21.2347 8.7892 21.5199 9.1219L22.2023 9.918C22.8359 10.6572
         23.1526 11.0267 23.2734 11.4412C23.3798 11.8065 23.3798 12.1946 23.2734 12.5599C23.1526
         12.9743 22.8359 13.3439 22.2023 14.0831L21.5199 14.8792C21.2347 15.2119 21.0921 15.3783
         20.9906 15.5659C20.9005 15.7324 20.8345 15.9108 20.7945 16.0958C20.7495 16.3044 20.7495
         16.5235 20.7495 16.9617V17.5505C20.7495 18.6706 20.7495 19.2307 20.5315 19.6585C20.3398
         20.0348 20.0338 20.3408 19.6575 20.5325C19.2297 20.7505 18.6696 20.7505 17.5495
         20.7505H16.9607C16.5225 20.7505 16.3034 20.7505 16.0948 20.7956C15.9098 20.8355 15.7314
         20.9015 15.5649 20.9916C15.3772 21.0931 15.2109 21.2357 14.8782 21.5209L14.082
         22.2033C13.3429 22.8369 12.9733 23.1537 12.5589 23.2744C12.1936 23.3808 11.8055 23.3808
         11.4402 23.2744C11.0257 23.1536 10.6561 22.8369 9.917 22.2033L9.12085 21.5209C8.78814
         21.2357 8.62179 21.0931 8.43412 20.9916C8.26765 20.9015 8.08923 20.8355 7.90421
         20.7956C7.69562 20.7505 7.47652 20.7505 7.03832 20.7505H6.4153C5.29519 20.7505 4.73514
         20.7505 4.30732 20.5325C3.931 20.3408 3.62503 20.0348 3.43329 19.6585C3.2153 19.2307
         3.2153 18.6706 3.2153 17.5505V16.949C3.2153 16.5146 3.2153 16.2973 3.17099
         16.0903C3.13169 15.9067 3.06672 15.7296 2.97801 15.5641C2.878 15.3775 2.73756 15.2118
         2.45668 14.8803L1.76945 14.0693C1.14668 13.3343 0.835291 12.9669 0.716483
         12.5555C0.611756 12.1929 0.611756 11.8081 0.716483 11.4455C0.835291 11.0342 1.14668
         10.6667 1.76945 9.9318L2.45668 9.1208C2.73756 8.7893 2.878 8.6236 2.97801
         8.437C3.06672 8.2715 3.13169 8.0944 3.17099 7.9108C3.2153 7.7038 3.2153 7.4865
         3.2153 7.052V6.4505C3.2153 5.3304 3.2153 4.7704 3.43329 4.3426C3.62503 3.9662 3.931
         3.6603 4.30732 3.4685C4.73514 3.2505 5.2952 3.2505 6.4153 3.2505H7.03832C7.47652
         3.2505 7.69562 3.2505 7.90421 3.2055C8.08923 3.1656 8.26765 3.0996 8.43412
         3.0095C8.62179 2.9079 8.78814 2.7653 9.12084 2.4802L9.91699 1.7978C10.6561 1.1642
         11.0257 0.8474 11.4402 0.7267C11.8055 0.6203 12.1936 0.6203 12.5589 0.7267ZM16.5306
         9.5303C16.8235 9.2374 16.8235 8.7626 16.5306 8.4697C16.2377 8.1768 15.7628 8.1768
         15.4699 8.4697L11.0002 12.9393L9.53058 11.4697C9.23768 11.1768 8.76281 11.1768
         8.46992 11.4697C8.17702 11.7626 8.17702 12.2374 8.46992 12.5303L10.4699
         14.5303C10.6106 14.671 10.8013 14.75 11.0002 14.75C11.1992 14.75 11.3899 14.671
         11.5306 14.5303L16.5306 9.5303Z"
      fill="#4A99E9"/>
  </g>`;
}

function renderPlaceholderAvatar(
  cx: number,
  cy: number,
  radius: number,
): string {
  return `<g>
    <circle cx="${cx}" cy="${cy}" r="${radius}" fill="#D9D9D9"/>
    <circle cx="${cx}" cy="${cy - radius * 0.33}" r="${radius * 0.34}" fill="#FFFFFF"/>
    <path d="M ${cx - radius * 0.64} ${cy + radius * 0.72}
             Q ${cx - radius * 0.52} ${cy + radius * 0.1} ${cx} ${cy + radius * 0.1}
             Q ${cx + radius * 0.52} ${cy + radius * 0.1} ${cx + radius * 0.64} ${cy + radius * 0.72}
             Z"
          fill="#FFFFFF"/>
  </g>`;
}

function votePillIcon(): string {
  return `<path d="M10 19a3.966 3.966 0 0 1-3.96-3.962V10.98H2.838a1.73 1.73 0 0 1-1.605-1.073 1.73 1.73 0 0 1 .377-1.895L9.364.254a.925.925 0 0 1 1.272 0l7.754 7.759c.498.499.646 1.242.376 1.894s-.9 1.073-1.605 1.073h-3.202v4.058A3.965 3.965 0 0 1 9.999 19zM2.989 9.179H7.84v5.731c0 1.13.81 2.163 1.934 2.278a2.163 2.163 0 0 0 2.386-2.15V9.179h4.851L10 2.163z"/>`;
}

function downvotePillIcon(): string {
  return `<path d="M10 1a3.966 3.966 0 0 1 3.96 3.962V9.02h3.202c.706 0 1.335.42 1.605 1.073.27.652.122 1.396-.377 1.895l-7.754 7.759a.925.925 0 0 1-1.272 0l-7.754-7.76a1.73 1.73 0 0 1-.376-1.894c.27-.652.9-1.073 1.605-1.073h3.202V4.962A3.965 3.965 0 0 1 10 1m7.01 9.82h-4.85V5.09c0-1.13-.81-2.163-1.934-2.278a2.163 2.163 0 0 0-2.386 2.15v5.859H2.989l7.01 7.016z"/>`;
}

function commentIcon(): string {
  return `<path d="M10 1a9 9 0 0 0-9 9c0 1.947.79 3.58 1.935 4.957L.231 17.661A.784.784 0 0 0 .785 19H10a9 9 0 0 0 9-9 9 9 0 0 0-9-9m0 16.2H6.162c-.994.004-1.907.053-3.045.144l-.076-.188a37 37 0 0 0 2.328-2.087l-1.05-1.263C3.297 12.576 2.8 11.331 2.8 10c0-3.97 3.23-7.2 7.2-7.2s7.2 3.23 7.2 7.2-3.23 7.2-7.2 7.2"/>`;
}

function awardIcon(): string {
  return `<path d="m18.75 14.536-2.414-3.581A6.95 6.95 0 0 0 17 8c0-3.86-3.14-7-6.999-7S3.002 4.14 3.002 8c0 1.057.242 2.056.664 2.955l-2.414 3.581c-.289.428-.33.962-.109 1.429.22.467.658.776 1.173.826l1.575.151.758 1.494a1.44 1.44 0 0 0 1.297.795c.482 0 .926-.234 1.198-.639l2.437-3.612c.14.008.28.021.423.021s.282-.013.423-.021l2.437 3.612c.272.405.716.639 1.198.639q.046 0 .094-.003a1.44 1.44 0 0 0 1.203-.791l.758-1.495 1.576-.151c.514-.05.952-.358 1.172-.826a1.43 1.43 0 0 0-.109-1.429zM10 2.8A5.205 5.205 0 0 1 15.2 8c0 2.867-2.333 5.2-5.2 5.2A5.205 5.205 0 0 1 4.801 8c0-2.867 2.332-5.2 5.2-5.2zM5.982 17.09l-.937-1.846-1.974-.189 1.66-2.462a7 7 0 0 0 2.936 1.999zm10.947-2.035-1.974.189-.937 1.846-1.685-2.499a7 7 0 0 0 2.936-1.999l1.66 2.462z"/>`;
}

function shareIcon(): string {
  return `<path d="m12.8 17.524 6.89-6.887a.9.9 0 0 0 0-1.273L12.8 2.477a1.64 1.64 0 0 0-1.782-.349 1.64 1.64 0 0 0-1.014 1.518v2.593C4.054 6.728 1.192 12.075 1 17.376a1.35 1.35 0 0 0 .862 1.32 1.35 1.35 0 0 0 1.531-.364l.334-.381c1.705-1.944 3.323-3.791 6.277-4.103v2.509c0 .667.398 1.262 1.014 1.518a1.64 1.64 0 0 0 1.783-.349zm-.994-1.548V12h-.9c-3.969 0-6.162 2.1-8.001 4.161.514-4.011 2.823-8.16 8-8.16h.9V4.024L17.784 10z"/>`;
}

function renderIcon(x: number, y: number, path: string, scale: number): string {
  return `<g transform="translate(${x}, ${y}) scale(${scale})"><svg width="20" height="20" viewBox="0 0 20 20" fill="#11151A" xmlns="http://www.w3.org/2000/svg">${path}</svg></g>`;
}

function renderVotePill(
  x: number,
  y: number,
  height: number,
  text: string,
  sizes: {
    padX: number;
    icon: number;
    innerGap: number;
    textFont: number;
    textRatio: number;
  },
): { width: number; svg: string } {
  const textW = estimateTextWidth(text, sizes.textFont, sizes.textRatio);
  const width = sizes.padX * 2 + sizes.icon * 2 + sizes.innerGap * 2 + textW;
  const iconScale = sizes.icon / 20;
  const iconY = y + (height - sizes.icon) / 2;
  const textX = x + sizes.padX + sizes.icon + sizes.innerGap;
  const textY = y + height / 2 + sizes.textFont * 0.34;

  return {
    width,
    svg: `
      <rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${height / 2}" fill="#E5EBEE"/>
      ${renderIcon(x + sizes.padX, iconY, votePillIcon(), iconScale)}
      <text x="${textX}" y="${textY}" font-size="${sizes.textFont}" line-height="${sizes.textFont * 1.33}" font-weight="600" fill="#000000">${esc(text)}</text>
      ${renderIcon(x + width - sizes.padX - sizes.icon, iconY, downvotePillIcon(), iconScale)}
    `,
  };
}

function renderPill(
  x: number,
  y: number,
  height: number,
  text: string,
  iconPath: string,
  sizes: {
    padX: number;
    icon: number;
    innerGap: number;
    textFont: number;
    textRatio: number;
  },
  iconOnly = false,
): { width: number; svg: string } {
  const textW = iconOnly
    ? 0
    : estimateTextWidth(text, sizes.textFont, sizes.textRatio);
  const width = iconOnly
    ? sizes.padX * 2 + sizes.icon
    : sizes.padX * 2 + sizes.icon + sizes.innerGap + textW;
  const iconScale = sizes.icon / 20;
  const iconY = y + (height - sizes.icon) / 2;
  const textX = x + sizes.padX + sizes.icon + sizes.innerGap;
  const textY = y + height / 2 + sizes.textFont * 0.34;

  return {
    width,
    svg: `
      <rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${height / 2}" fill="#E5EBEE"/>
      ${renderIcon(x + sizes.padX, iconY, iconPath, iconScale)}
      ${iconOnly ? "" : `<text x="${textX}" y="${textY}" font-size="${sizes.textFont}" line-height="${sizes.textFont * 1.33}" font-weight="600" fill="#000000">${esc(text)}</text>`}
    `,
  };
}

export const generateRedditCardSvg = (
  config: SvgCardConfig,
  outputPath: string,
  base64Regular?: string,
  base64Bold?: string,
): void => {
  const W = 1080;
  const H = 1920;
  const BASE_CARD_WIDTH = 560;

  const overlay = config.overlay ?? {};
  const requestedWidth = Math.round(
    (overlay.width ?? 560) * Math.max(0.85, Math.min(overlay.scale ?? 1, 1.15)),
  );
  const cardWidth = Math.max(520, Math.min(680, requestedWidth));
  const ui = cardWidth / BASE_CARD_WIDTH;
  const cardX = Math.round((W - cardWidth) / 2);
  const cardY = Math.round(overlay.marginTop ?? 54);

  const pad = 14 * ui;
  const cardRadius = 8 * ui;
  const avatarSize = 32 * ui;
  const headerGap = 8 * ui;
  const headerMarginBottom = 4 * ui;
  const metaGap = 2 * ui;
  const metaRowGap = 4 * ui;
  const titleMarginBottom = 8 * ui;
  const actionsMarginTop = 6 * ui;
  const actionsGap = 8 * ui;
  const actionGroupGap = 8 * ui;
  const pillPadX = 10 * ui;
  const pillPadY = 7 * ui;
  const pillInnerGap = 6 * ui;
  const pillIcon = 16 * ui;
  const pillHeight = pillIcon + pillPadY * 2;

  const subredditFont = 12 * ui;
  const subredditLineHeight = 16 * ui;
  const usernameFont = 12 * ui;
  const usernameLineHeight = 16 * ui;
  const titleFont = 18 * ui;
  const titleLineHeight = 24 * ui;
  const bodyFont = 12 * ui;
  const bodyLineHeight = 16 * ui;
  const pillTextFont = 12 * ui;

  const subredditRaw = (config.subreddit ?? "Stories").trim() || "Stories";
  const subreddit = withPrefix(subredditRaw.replace(/^r\//i, ""), "r/");
  const username =
    (config.username ?? "throwaway_8462").trim() || "throwaway_8462";
  const postTitle =
    (config.postTitle ?? "Your post title goes here").trim() ||
    "Your post title goes here";
  const postBody = (config.postBody ?? "").trim();
  const upvoteText = formatCompactCount(config.upvotes ?? 99);
  const commentText = formatCompactCount(config.comments ?? 99);
  const showVerified = config.showVerified ?? false;
  const showAwards = config.showAwards ?? false;

  const innerX = cardX + pad;
  const innerW = cardWidth - pad * 2;
  const headerTop = cardY + pad;
  const avatarCx = innerX + avatarSize / 2;
  const avatarCy = headerTop + avatarSize / 2;
  const metaX = innerX + avatarSize + headerGap;
  const metaTop = headerTop + 2 * ui;
  const subredditY = metaTop + subredditFont;
  const usernameY = subredditY + metaGap + usernameLineHeight;
  const badgeX =
    metaX + estimateTextWidth(subreddit, subredditFont, 0.56) + metaRowGap;

  const titleTop = headerTop + avatarSize + headerMarginBottom;
  const titleBaseline = titleTop + titleFont;
  const titleLines = clampLines(postTitle, innerW, titleFont * 0.54, 3);
  const titleBottom = titleTop + titleLines.length * titleLineHeight;

  const bodyTop = titleBottom + titleMarginBottom;
  const bodyLines = postBody
    ? clampLines(postBody, innerW, bodyFont * 0.56, 2)
    : [];
  const bodyBaseline = bodyTop + bodyFont;
  const bodyBottom =
    bodyLines.length > 0
      ? bodyTop + bodyLines.length * bodyLineHeight
      : titleBottom;

  const actionsY = bodyBottom + actionsMarginTop;
  const pillSizes = {
    padX: pillPadX,
    icon: pillIcon,
    innerGap: pillInnerGap,
    textFont: pillTextFont,
    textRatio: 0.58,
  };

  let cursorX = innerX;
  const votePill = renderVotePill(
    cursorX,
    actionsY,
    pillHeight,
    upvoteText,
    pillSizes,
  );
  cursorX += votePill.width + actionsGap;
  const commentPill = renderPill(
    cursorX,
    actionsY,
    pillHeight,
    commentText,
    commentIcon(),
    pillSizes,
  );
  cursorX += commentPill.width + actionGroupGap;

  const awardPill = showAwards
    ? renderPill(
        cursorX,
        actionsY,
        pillHeight,
        "",
        awardIcon(),
        pillSizes,
        true,
      )
    : null;
  if (awardPill) cursorX += awardPill.width + actionsGap;
  const sharePill = renderPill(
    cursorX,
    actionsY,
    pillHeight,
    "Share",
    shareIcon(),
    pillSizes,
  );

  const cardHeight = actionsY + pillHeight + pad - cardY;

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <style>
      ${
        base64Regular
          ? `@font-face {
        font-family: 'Inter';
        src: url('data:font/woff2;base64,${base64Regular}') format('woff2');
        font-weight: 400;
      }`
          : ""
      }
      ${
        base64Bold
          ? `@font-face {
        font-family: 'Inter';
        src: url('data:font/woff2;base64,${base64Bold}') format('woff2');
        font-weight: 700;
      }`
          : ""
      }
      text { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
    </style>
    <filter id="cardShadow" x="-10%" y="-10%" width="130%" height="140%">
      <feDropShadow dx="0" dy="1" stdDeviation="1.5" flood-color="#0000001F"/>
      <feDropShadow dx="0" dy="1" stdDeviation="1" flood-color="#00000014"/>
    </filter>
  </defs>

  <rect x="${cardX}" y="${cardY}" width="${cardWidth}" height="${cardHeight}" rx="${cardRadius}" ry="${cardRadius}" fill="#FFFFFF" filter="url(#cardShadow)"/>

  ${renderPlaceholderAvatar(avatarCx, avatarCy, avatarSize / 2)}

  <text x="${metaX}" y="${subredditY}" font-size="${subredditFont}" font-weight="700" fill="#2E3640">${esc(subreddit)}</text>
  ${showVerified ? verifiedBadge(badgeX, subredditY, 12 * ui) : ""}
  <text x="${metaX}" y="${usernameY}" font-size="${usernameFont}" font-weight="400" fill="#5C6C74">${esc(username)}</text>

  ${titleLines.map((line, index) => `<text x="${innerX}" y="${titleBaseline + index * titleLineHeight}" font-size="${titleFont}" font-weight="600" fill="#11151A">${esc(line)}</text>`).join("\n  ")}
  ${bodyLines.map((line, index) => `<text x="${innerX}" y="${bodyBaseline + index * bodyLineHeight}" font-size="${bodyFont}" font-weight="400" fill="#5C6C74">${esc(line)}</text>`).join("\n  ")}

  ${votePill.svg}
  ${commentPill.svg}
  ${awardPill ? awardPill.svg : ""}
  ${sharePill.svg}
</svg>`;

  fs.writeFileSync(outputPath, svg);
  console.log(`[SVG Service] Reddit card written → ${outputPath}`);
};

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
