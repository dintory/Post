/**
 * Shared Layout Engine
 *
 * Pure TypeScript — zero DOM/Node APIs.
 * Used identically by:
 *   - Frontend preview (VideoEffects.tsx)
 *   - Backend SVG generator (svgService.ts)
 *   - Backend subtitle generator (videoPipeline.ts)
 *
 * All positions are defined as ratios of the 1080×1920 output frame
 * so they scale consistently regardless of render resolution.
 */

export interface FrameDimensions {
  width: number;
  height: number;
}

export type VerticalPlacement = "top" | "center" | "bottom";

export interface CardLayout {
  x: number;
  y: number;
  width: number;
  height: number;
}

// ─── Ratios (single source of truth) ──────────────────────────────────────

/** Card width as fraction of frame width */
export const CARD_WIDTH_RATIO = 0.52;

/** Safe margin from top/bottom edges as fraction of frame height */
export const EDGE_SAFE_MARGIN_RATIO = 0.042;

/** Side margin ratio (calculated from card width) */
export const CARD_SIDE_MARGIN_RATIO = (1 - CARD_WIDTH_RATIO) / 2;

/** Caption offset from edge as fraction of frame height */
export const CAPTION_EDGE_OFFSET_RATIO = 0.042;

// ─── Card Layout ──────────────────────────────────────────────────────────

export function getCardLayout(
  frame: FrameDimensions,
  placement: VerticalPlacement,
  cardHeightPx: number,
): CardLayout {
  const width = Math.round(frame.width * CARD_WIDTH_RATIO);
  const x = Math.round(frame.width * CARD_SIDE_MARGIN_RATIO);

  let y: number;
  if (placement === "top") {
    y = Math.round(frame.height * EDGE_SAFE_MARGIN_RATIO);
  } else if (placement === "bottom") {
    y = Math.round(
      frame.height * (1 - EDGE_SAFE_MARGIN_RATIO) - cardHeightPx,
    );
  } else {
    // center
    y = Math.round((frame.height - cardHeightPx) / 2);
  }

  return { x, y, width, height: cardHeightPx };
}

// ─── Caption Y Position ───────────────────────────────────────────────────

export function getCaptionY(
  frame: FrameDimensions,
  placement: VerticalPlacement,
): number {
  if (placement === "top") {
    return Math.round(frame.height * CAPTION_EDGE_OFFSET_RATIO);
  }
  if (placement === "bottom") {
    return Math.round(
      frame.height * (1 - CAPTION_EDGE_OFFSET_RATIO),
    );
  }
  return Math.round(frame.height / 2);
}
