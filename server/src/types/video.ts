export type VideoFormat = "pov_slideshow" | "reddit_story";

export type VideoQueueStatus =
  | "generating"
  | "generating_voice"
  | "compositing"
  | "completed"
  | "failed";

export interface VideoGenerationJob {
  userId: string;
  title: string;
  format: VideoFormat;
  scheduledAt?: string;
  durationType?: string;
  voiceStyle?: string;
  pacing?: string;
  musicStyle?: string;
  imageStyle?: string;
  subtitleStyle?: string;
  aiModel?: string;
  /** Pre-generated script from the wizard — skip AI generation if provided */
  script?: any;
  /** Reddit card styling configuration, stats, and metadata */
  redditConfig?: any;
  description?: string;
  /** If true, automatically upload the generated video to YouTube */
  autoUpload?: boolean;
  /** YouTube OAuth refresh token for auto-upload */
  refreshToken?: string;
  /** Caption text color in hex (e.g. "#FFFFFF") */
  captionColor?: string;
  /** Whether caption outline is enabled */
  captionOutlineEnabled?: boolean;
  /** Caption outline width (1-8) */
  captionOutlineWidth?: number;
  /** Vertical placement of captions */
  textPlacement?: "top" | "center" | "bottom";
  /** Absolute caption center X in full-res (1080×1920) frame px. Overrides textPlacement horizontally. */
  captionX?: number;
  /** Absolute caption top Y in full-res (1080×1920) frame px. Overrides textPlacement vertically. */
  captionY?: number;
  /** Caption text scale multiplier (1 = default size). */
  captionScale?: number;
  /** Caption entrance animation style */
  captionAnimation?: "pop-out" | "linear" | "slide" | "fade";
  /** Caption exit animation style */
  captionExit?: "fade" | "slide-down" | "scale-down" | "none";
  /** Authenticated Supabase JWT token to run DB operations under the user session */
  token?: string;
  /** Reddit card width as percentage of frame width (30-90), default 52 */
  cardWidthPercent?: number;
}
