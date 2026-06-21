/**
 * Server-side Reddit card renderer using Satori + resvg-js.
 *
 * Replaces the hand-coded SVG generator with actual component-level
 * rendering that matches RedditCard.tsx in the frontend.
 *
 * Render free tier compatible: no browser needed, ~10MB deps.
 */
import satori, { type FontWeight } from "satori";
import { Resvg } from "@resvg/resvg-js";
import { loadFonts } from "./fontLoader";
// RedditCardConfig type — matches client/src/templates/reddit/defaults.ts
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

// ─── SVG icon element builders (Satori doesn't support dangerouslySetInnerHTML) ──

function commentSvg(textSub: string) {
  return {
    type: "svg",
    props: {
      width: 16,
      height: 16,
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: textSub,
      strokeWidth: 2,
      strokeLinecap: "round" as const,
      strokeLinejoin: "round" as const,
      children: {
        type: "path",
        props: {
          d: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z",
        },
      },
    },
  };
}

function shareSvg(textSub: string) {
  return {
    type: "svg",
    props: {
      width: 16,
      height: 16,
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: textSub,
      strokeWidth: 2,
      strokeLinecap: "round" as const,
      strokeLinejoin: "round" as const,
      children: [
        {
          type: "path",
          props: { d: "M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" },
        },
        {
          type: "polyline",
          props: { points: "16 6 12 2 8 6" },
        },
        {
          type: "line",
          props: { x1: "12", y1: "2", x2: "12", y2: "15" },
        },
      ],
    },
  };
}

function awardSvg(textSub: string) {
  return {
    type: "svg",
    props: {
      width: 16,
      height: 16,
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: textSub,
      strokeWidth: 2,
      strokeLinecap: "round" as const,
      strokeLinejoin: "round" as const,
      children: [
        {
          type: "circle",
          props: { cx: "12", cy: "8", r: "6" },
        },
        {
          type: "path",
          props: { d: "M15.477 12.89L17 22l-5-3-5 3 1.523-9.11" },
        },
      ],
    },
  };
}

function formatCount(n: number): string {
  if (n >= 1_000_000)
    return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}m`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, "")}k`;
  return String(n);
}

// ─── Main render function ───────────────────────────────────────────────────

export interface CardRenderOptions {
  /** Width of the output image (e.g. 540 for card-only, 1080 for full frame) */
  width: number;
  /** Height of the output image */
  height: number;
}

export async function renderCardToPng(
  config: RedditCardConfig,
  options: CardRenderOptions,
): Promise<Buffer> {
  const fonts = await loadFonts();

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

  const upvoteArrowFill = config.upvoteState === "up" ? upvoteColor : "none";
  const downvoteArrowFill = config.upvoteState === "down" ? "#7193ff" : "none";

  const cardW = options.width;

  const svg = await satori(
    {
      type: "div",
      props: {
        style: {
          width: cardW,
          background: bg,
          border: `1px solid ${border}`,
          borderRadius: 4,
          fontFamily: "IBM Plex Sans, sans-serif",
          overflow: "hidden",
          display: "flex",
          boxSizing: "border-box",
        },
        children: {
          type: "div",
          props: {
            style: { display: "flex" },
            children: [
              // ── Left vote sidebar ──
              {
                type: "div",
                props: {
                  style: {
                    width: 40,
                    background: bgInner,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    paddingTop: 8,
                    paddingBottom: 8,
                    paddingLeft: 4,
                    paddingRight: 4,
                    gap: 2,
                    flexShrink: 0,
                    boxSizing: "border-box",
                  },
                  children: [
                    // Upvote arrow
                    {
                      type: "svg",
                      props: {
                        width: 20,
                        height: 20,
                        viewBox: "0 0 24 24",
                        fill: upvoteArrowFill,
                        stroke: upvoteColor,
                        strokeWidth: 2,
                        children: {
                          type: "path",
                          props: {
                            d: "M12 4l8 8H4z",
                          },
                        },
                      },
                    },
                    // Vote count
                    {
                      type: "span",
                      props: {
                        style: {
                          fontSize: 12,
                          fontWeight: 700,
                          color: upvoteColor,
                          lineHeight: "16px",
                        },
                        children: formatCount(displayUpvotes),
                      },
                    },
                    // Downvote arrow
                    {
                      type: "svg",
                      props: {
                        width: 20,
                        height: 20,
                        viewBox: "0 0 24 24",
                        fill: downvoteArrowFill,
                        stroke:
                          config.upvoteState === "down" ? "#7193ff" : textSub,
                        strokeWidth: 2,
                        children: {
                          type: "path",
                          props: {
                            d: "M12 20l-8-8h16z",
                          },
                        },
                      },
                    },
                  ],
                },
              },

              // ── Main content ──
              {
                type: "div",
                props: {
                  style: {
                    flex: 1,
                    padding: "8px 8px 8px 0",
                    boxSizing: "border-box",
                  },
                  children: [
                    // Header row
                    {
                      type: "div",
                      props: {
                        style: {
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          marginBottom: 6,
                        },
                        children: [
                          // Avatar
                          {
                            type: "div",
                            props: {
                              style: {
                                width: 20,
                                height: 20,
                                borderRadius: "50%",
                                overflow: "hidden",
                                flexShrink: 0,
                                border: `1px solid ${border}`,
                              },
                              children: {
                                type: "img",
                                props: {
                                  src: config.avatarSrc || undefined,
                                  width: 20,
                                  height: 20,
                                  style: {
                                    objectFit: "cover",
                                    width: "100%",
                                    height: "100%",
                                  },
                                },
                              },
                            },
                          },
                          // Subreddit + user + time
                          {
                            type: "div",
                            props: {
                              style: {
                                display: "flex",
                                alignItems: "center",
                                gap: 4,
                                flexWrap: "wrap",
                              },
                              children: [
                                {
                                  type: "span",
                                  props: {
                                    style: {
                                      fontSize: 12,
                                      fontWeight: 700,
                                      color: textMain,
                                    },
                                    children: `r/${config.subreddit || "AskReddit"}`,
                                  },
                                },
                                {
                                  type: "span",
                                  props: {
                                    style: { fontSize: 12, color: textSub },
                                    children: "•",
                                  },
                                },
                                {
                                  type: "span",
                                  props: {
                                    style: { fontSize: 12, color: textSub },
                                    children: `Posted by u/${config.username || "anonymous"}`,
                                  },
                                },
                                {
                                  type: "span",
                                  props: {
                                    style: { fontSize: 12, color: textSub },
                                    children: config.timeAgo || "4 hours ago",
                                  },
                                },
                              ],
                            },
                          },
                        ],
                      },
                    },

                    // Title
                    {
                      type: "h3",
                      props: {
                        style: {
                          margin: "0 0 6px 0",
                          fontSize: 18,
                          fontWeight: 700,
                          color: textMain,
                          lineHeight: 1.35,
                          wordBreak: "break-word",
                        },
                        children:
                          config.postTitle || "Your post title goes here",
                      },
                    },

                    // Body (truncated at ~6 lines)
                    ...(config.postBody
                      ? [
                          {
                            type: "p",
                            props: {
                              style: {
                                margin: "0 0 8px 0",
                                fontSize: 14,
                                color: textMain,
                                lineHeight: 1.6,
                                wordBreak: "break-word",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                display: "-webkit-box",
                                WebkitLineClamp: 6,
                                WebkitBoxOrient: "vertical",
                              } as any,
                              children: config.postBody,
                            },
                          },
                        ]
                      : []),

                    // Awards
                    ...(config.showAwards
                      ? [
                          {
                            type: "div",
                            props: {
                              style: {
                                display: "flex",
                                alignItems: "center",
                                gap: 4,
                                marginBottom: 8,
                              },
                              children: [
                                ...["🏆", "⭐", "🎖️", "💎", "🌟"].map((a) => ({
                                  type: "span",
                                  props: {
                                    style: { fontSize: 14 },
                                    children: a,
                                  },
                                })),
                                {
                                  type: "span",
                                  props: {
                                    style: {
                                      fontSize: 12,
                                      color: textSub,
                                      fontWeight: 600,
                                    },
                                    children: "342",
                                  },
                                },
                              ],
                            },
                          },
                        ]
                      : []),

                    // Action buttons
                    {
                      type: "div",
                      props: {
                        style: {
                          display: "flex",
                          alignItems: "center",
                          gap: 2,
                        },
                        children: [
                          // Comment button
                          {
                            type: "div",
                            props: {
                              style: {
                                display: "flex",
                                alignItems: "center",
                                gap: 4,
                                padding: "4px 6px",
                                borderRadius: 2,
                                color: textSub,
                                fontSize: 12,
                                fontWeight: 700,
                              },
                              children: [
                                commentSvg(textSub),
                                `${formatCount(config.comments)} Comments`,
                              ],
                            },
                          },
                          // Share button
                          {
                            type: "div",
                            props: {
                              style: {
                                display: "flex",
                                alignItems: "center",
                                gap: 4,
                                padding: "4px 6px",
                                borderRadius: 2,
                                color: textSub,
                                fontSize: 12,
                                fontWeight: 700,
                              },
                              children: [shareSvg(textSub), "Share"],
                            },
                          },
                          // Award button
                          {
                            type: "div",
                            props: {
                              style: {
                                display: "flex",
                                alignItems: "center",
                                gap: 4,
                                padding: "4px 6px",
                                borderRadius: 2,
                                color: textSub,
                                fontSize: 12,
                                fontWeight: 700,
                              },
                              children: [awardSvg(textSub), "Award"],
                            },
                          },
                        ],
                      },
                    },
                  ],
                },
              },
            ],
          },
        },
      },
    },
    {
      width: cardW,
      height: options.height,
      fonts: fonts.map((f) => ({
        name: f.name,
        weight: f.weight as FontWeight,
        data: f.data,
      })),
    },
  );

  // Convert SVG to PNG
  const resvg = new Resvg(svg, {
    fitTo: {
      mode: "width",
      value: cardW * 2, // 2x for retina quality
    },
    background: "rgba(0,0,0,0)",
  });
  const pngData = resvg.render();
  return Buffer.from(pngData.asPng());
}
