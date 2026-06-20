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
  /** Authenticated Supabase JWT token to run DB operations under the user session */
  token?: string;
}
