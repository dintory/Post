/**
 * Shared Reddit Card SVG Renderer
 *
 * Pure TypeScript — zero DOM/Node APIs.
 * Used identically by:
 *   - Frontend preview (VideoEffects.tsx)
 *   - Backend SVG generator (svgService.ts)
 *
 * Generates the SVG markup for a Reddit post card matching the
 * reference design (Inter font, #E5EBEE pills, 32px avatar,
 * subreddit • timestamp header, action bar with vote/comment/award/share).
 */

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

// ─── Icons ──────────────────────────────────────────────────────────────────

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
      <text x="${textX}" y="${textY}" font-size="${sizes.textFont}" font-weight="600" fill="#000000">${esc(text)}</text>
      ${renderIcon(x + width - sizes.padX - sizes.icon, iconY, downvotePillIcon(), iconScale)}`,
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
      ${iconOnly ? "" : `<text x="${textX}" y="${textY}" font-size="${sizes.textFont}" font-weight="600" fill="#000000">${esc(text)}</text>`}`,
  };
}

function renderAvatar(
  cx: number,
  cy: number,
  radius: number,
  avatarSrc?: string,
): string {
  if (avatarSrc) {
    const d = radius * 2;
    const x = cx - radius;
    const y = cy - radius;
    return `<g><clipPath id="avatarClip"><circle cx="${cx}" cy="${cy}" r="${radius}"/></clipPath><image x="${x}" y="${y}" width="${d}" height="${d}" preserveAspectRatio="xMidYMid slice" href="${esc(avatarSrc)}" xlink:href="${esc(avatarSrc)}" clip-path="url(#avatarClip)"/></g>`;
  }
  return `<g><circle cx="${cx}" cy="${cy}" r="${radius}" fill="#FF4500"/><path d="M ${cx - radius * 0.5} ${cy + radius * 0.15} Q ${cx} ${cy - radius * 0.7} ${cx + radius * 0.5} ${cy + radius * 0.15} Z" fill="white"/></g>`;
}

// ─── Public Types ───────────────────────────────────────────────────────────

export interface CardContentConfig {
  subreddit?: string;
  username?: string;
  timeAgo?: string;
  postTitle?: string;
  postBody?: string;
  showBody?: boolean;
  upvotes?: number;
  comments?: number;
  showAwards?: boolean;
  avatarSrc?: string;
  cardY?: number;
}

export interface RenderCardOptions {
  width?: number;
  height?: number;
  cardX?: number;
  cardWidth?: number;
  base64Regular?: string;
  base64Bold?: string;
}

// ─── Main Renderer ──────────────────────────────────────────────────────────

export function generateRedditCardSvg(
  config: CardContentConfig,
  options: RenderCardOptions = {},
): string {
  const W = options.width ?? 1080;
  const H = options.height ?? 1920;
  const cardWidth = options.cardWidth ?? Math.round(W * 0.52);
  const cardX = options.cardX ?? Math.round((W * (1 - 0.52)) / 2);
  const base64Regular = options.base64Regular;
  const base64Bold = options.base64Bold;

  const ui = cardWidth / 560;
  const cardY = config.cardY ?? 54;

  const pad = 20 * ui;
  const cardRadius = 8 * ui;
  const subredditFont = 12 * ui;
  const titleFont = 18 * ui;
  const titleLineHeight = 24 * ui;
  const bodyFont = 12 * ui;
  const bodyLineHeight = 16 * ui;
  const pillTextFont = 12 * ui;

  // Header layout: avatar on the left, two stacked text lines (subreddit +
  // username) on the right. The avatar spans the full header text block and
  // is vertically centered on it so it aligns cleanly with both lines.
  const headerGap = 10 * ui;
  const headerInnerGap = 3 * ui;
  const headerTextHeight = subredditFont * 2 + headerInnerGap;
  const avatarSize = headerTextHeight;
  const headerMarginBottom = 6 * ui;
  const titleMarginBottom = 8 * ui;
  const actionsMarginTop = 8 * ui;
  const actionsGap = 8 * ui;
  const actionGroupGap = 8 * ui;
  const pillPadX = 10 * ui;
  const pillPadY = 7 * ui;
  const pillInnerGap = 6 * ui;
  const pillIcon = 16 * ui;

  const subredditRaw = (config.subreddit ?? "Stories").trim() || "Stories";
  const subreddit = withPrefix(subredditRaw.replace(/^r\//i, ""), "r/");
  const username =
    (config.username ?? "throwaway_8462").trim() || "throwaway_8462";
  const timeAgo = (config.timeAgo ?? "2 hr. ago").trim() || "2 hr. ago";
  const postTitle =
    (config.postTitle ?? "Your post title goes here").trim() ||
    "Your post title goes here";
  const postBody = config.showBody ? (config.postBody ?? "").trim() : "";
  const upvoteText = formatCompactCount(config.upvotes ?? 99);
  const commentText = formatCompactCount(config.comments ?? 99);
  const showAwards = config.showAwards ?? false;

  const innerX = cardX + pad;
  const innerW = cardWidth - pad * 2;
  const headerTop = cardY + pad;
  // Vertically center the avatar on the full header block (subreddit + gap +
  // username) so the avatar spans both lines.
  const avatarCx = innerX + avatarSize / 2;
  const avatarCy = headerTop + headerTextHeight / 2;
  const metaX = innerX + avatarSize + headerGap;
  const metaBaseline = headerTop + subredditFont;
  const usernameBaseline = metaBaseline + headerInnerGap + subredditFont;

  const titleTop = headerTop + headerTextHeight + headerMarginBottom;
  const titleBaseline = titleTop + titleFont;
  const titleLines = wrapText(postTitle, innerW, titleFont * 0.54);
  const titleBottom = titleTop + titleLines.length * titleLineHeight;

  const bodyTop = titleBottom + titleMarginBottom;
  const bodyLines = postBody
    ? clampLines(postBody, innerW, bodyFont * 0.56, 4)
    : [];
  const bodyBaseline = bodyTop + bodyFont;
  const bodyBottom =
    bodyLines.length > 0
      ? bodyTop + bodyLines.length * bodyLineHeight
      : titleBottom;

  // ── Action bar sizing ──────────────────────────────────────────────
  const approxVoteW =
    pillPadX * 2 +
    pillIcon * 2 +
    pillInnerGap * 2 +
    estimateTextWidth(upvoteText, pillTextFont, 0.58);
  const approxCommentW =
    pillPadX * 2 +
    pillIcon +
    pillInnerGap +
    estimateTextWidth(commentText, pillTextFont, 0.58);
  const approxAwardW = pillPadX * 2 + pillIcon;
  const approxShareW = pillPadX * 2 + pillIcon;
  const approxGaps =
    actionsGap + actionGroupGap + (showAwards ? actionsGap : 0);
  const approxTotal =
    approxVoteW +
    approxCommentW +
    approxShareW +
    approxGaps +
    (showAwards ? approxAwardW : 0);

  const pillScale = approxTotal > innerW ? (innerW - 4) / approxTotal : 1;

  const effPadX = pillPadX * pillScale;
  const effIcon = pillIcon * pillScale;
  const effInnerGap = pillInnerGap * pillScale;
  const effTextFont = pillTextFont * pillScale;
  const effPadY = pillPadY * pillScale;
  const effPillHeight = effIcon + effPadY * 2;
  const effActionsGap = actionsGap * pillScale;
  const effActionGroupGap = actionGroupGap * pillScale;

  const effPillSizes = {
    padX: effPadX,
    icon: effIcon,
    innerGap: effInnerGap,
    textFont: effTextFont,
    textRatio: 0.58,
  };

  const actionsY = bodyBottom + actionsMarginTop;

  let cursorX = innerX;
  const votePill = renderVotePill(
    cursorX,
    actionsY,
    effPillHeight,
    upvoteText,
    effPillSizes,
  );
  cursorX += votePill.width + effActionsGap;
  const commentPill = renderPill(
    cursorX,
    actionsY,
    effPillHeight,
    commentText,
    commentIcon(),
    effPillSizes,
  );
  cursorX += commentPill.width + effActionGroupGap;
  const awardPill = showAwards
    ? renderPill(
        cursorX,
        actionsY,
        effPillHeight,
        "",
        awardIcon(),
        effPillSizes,
        true,
      )
    : null;
  if (awardPill) cursorX += awardPill.width + effActionsGap;
  const sharePill = renderPill(
    cursorX,
    actionsY,
    effPillHeight,
    "",
    shareIcon(),
    effPillSizes,
    true,
  );

  const cardHeight = actionsY + effPillHeight + pad - cardY;

  const fontFace =
    base64Regular || base64Bold
      ? `<style>
      ${base64Regular ? `@font-face { font-family: 'Inter'; src: url('data:font/woff2;base64,${base64Regular}') format('woff2'); font-weight: 400; }` : ""}
      ${base64Bold ? `@font-face { font-family: 'Inter'; src: url('data:font/woff2;base64,${base64Bold}') format('woff2'); font-weight: 700; }` : ""}
      text { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
    </style>`
      : `<style>text { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }</style>`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <defs>
    ${fontFace}
    <filter id="cardShadow" x="-10%" y="-10%" width="130%" height="140%">
      <feDropShadow dx="0" dy="1" stdDeviation="1.5" flood-color="#0000001F"/>
      <feDropShadow dx="0" dy="1" stdDeviation="1" flood-color="#00000014"/>
    </filter>
    <clipPath id="cardClip">
      <rect x="${cardX}" y="${cardY}" width="${cardWidth}" height="${cardHeight}" rx="${cardRadius}"/>
    </clipPath>
  </defs>

  <rect x="${cardX}" y="${cardY}" width="${cardWidth}" height="${cardHeight}" rx="${cardRadius}" ry="${cardRadius}" fill="#FFFFFF" filter="url(#cardShadow)"/>

  <g clip-path="url(#cardClip)">
    ${renderAvatar(avatarCx, avatarCy, avatarSize / 2, config.avatarSrc)}

    <text x="${metaX}" y="${metaBaseline}" font-size="${subredditFont}">
      <tspan font-weight="700" fill="#2E3640">${esc(subreddit)}</tspan>
      <tspan font-weight="400" fill="#5C6C74"> • ${esc(timeAgo)}</tspan>
    </text>
    <text x="${metaX}" y="${usernameBaseline}" font-size="${subredditFont}" font-weight="400" fill="#5C6C74">${esc(username)}</text>

    ${titleLines.map((line, i) => `<text x="${innerX}" y="${titleBaseline + i * titleLineHeight}" font-size="${titleFont}" font-weight="600" fill="#11151A">${esc(line)}</text>`).join("\n    ")}
    ${bodyLines.map((line, i) => `<text x="${innerX}" y="${bodyBaseline + i * bodyLineHeight}" font-size="${bodyFont}" font-weight="400" fill="#5C6C74">${esc(line)}</text>`).join("\n    ")}

    ${votePill.svg}
    ${commentPill.svg}
    ${awardPill ? awardPill.svg : ""}
    ${sharePill.svg}
  </g>
</svg>`;
}
