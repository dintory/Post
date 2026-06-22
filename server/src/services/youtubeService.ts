import fs from "fs";
import path from "path";
import os from "os";
import { google } from "googleapis";

// ─── OAuth2 Client ──────────────────────────────────────────────────────────

const CLIENT_ID = process.env.YOUTUBE_CLIENT_ID;
const CLIENT_SECRET = process.env.YOUTUBE_CLIENT_SECRET;
const REDIRECT_URI =
  process.env.YOUTUBE_REDIRECT_URI ||
  "https://post-rtc8.onrender.com/auth/youtube/callback";

const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI,
);

const SCOPES = [
  "https://www.googleapis.com/auth/youtube.upload",
  "https://www.googleapis.com/auth/youtube.readonly",
];

/**
 * Generate the Google OAuth consent URL.
 * Pass the user's ID as `state` so the callback can associate the token.
 */
export const getAuthUrl = (userId?: string): string => {
  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    prompt: "consent",
    state: userId,
  });
};

/**
 * Exchange an authorization code for tokens.
 */
export const getTokens = async (
  code: string,
): Promise<{
  access_token?: string | null;
  refresh_token?: string | null;
  expiry_date?: number | null;
}> => {
  const { tokens } = await oauth2Client.getToken(code);
  return {
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expiry_date: tokens.expiry_date,
  };
};

/**
 * Save a YouTube refresh token to the youtube_accounts table.
 * Upserts by user_id so the token persists across restarts.
 */
export const saveRefreshToken = async (
  supabase: any,
  userId: string,
  email: string,
  refreshToken: string,
): Promise<void> => {
  // Check if a row already exists for this user
  const { data: existing, error: lookupErr } = await supabase
    .from("youtube_accounts")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  if (lookupErr) {
    console.error("[YouTube] Lookup error:", lookupErr);
    throw lookupErr;
  }

  if (existing) {
    const { error: updateErr } = await supabase
      .from("youtube_accounts")
      .update({
        refresh_token: refreshToken,
        status: "active",
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id);

    if (updateErr) {
      console.error("[YouTube] Update error:", updateErr);
      throw updateErr;
    }
    console.log(`[YouTube] Updated existing account ${existing.id}`);
  } else {
    const { data: inserted, error: insertErr } = await supabase
      .from("youtube_accounts")
      .insert({
        user_id: userId,
        email: email || "youtube-oauth",
        channel_name: "YouTube OAuth",
        status: "active",
        refresh_token: refreshToken,
      })
      .select()
      .single();

    if (insertErr) {
      console.error("[YouTube] Insert error:", insertErr);
      throw insertErr;
    }
    console.log(`[YouTube] Created account ${inserted?.id} for user ${userId}`);
  }
};

/**
 * Retrieve the stored refresh token for a user.
 * If accountId is given, return that account's token.
 */
export const getRefreshToken = async (
  supabase: any,
  userId: string,
  accountId?: string,
): Promise<string | null> => {
  let query = supabase
    .from("youtube_accounts")
    .select("refresh_token")
    .eq("user_id", userId)
    .not("refresh_token", "is", null);

  if (accountId) {
    query = query.eq("id", accountId);
  }

  const { data } = await query.maybeSingle();
  return data?.refresh_token ?? null;
};

/**
 * List all YouTube accounts that have a refresh token for the user.
 */
export const listConnectedAccounts = async (
  supabase: any,
  userId: string,
): Promise<any[]> => {
  const { data } = await supabase
    .from("youtube_accounts")
    .select(
      "id, channel_name, channel_id, subscriber_count, video_count, email, status, last_sync_at",
    )
    .eq("user_id", userId)
    .not("refresh_token", "is", null)
    .order("created_at", { ascending: false });

  return data || [];
};

// ─── Category Mapping ───────────────────────────────────────────────────────

export const CATEGORY_MAP: Record<string, string> = {
  Education: "27",
  Entertainment: "24",
  Gaming: "20",
  Music: "10",
  Technology: "28",
  "Science & Tech": "28",
  "Howto & Style": "26",
  "Film & Animation": "1",
  "Autos & Vehicles": "2",
  "Pets & Animals": "15",
  Sports: "17",
  "Travel & Events": "19",
  "News & Politics": "25",
  "Nonprofits & Activism": "29",
  Comedy: "23",
};

export interface UploadOptions {
  privacyStatus?: "public" | "private" | "unlisted";
  categoryId?: string;
  defaultLanguage?: string;
}

// ─── Video Upload ───────────────────────────────────────────────────────────

interface UploadResult {
  videoId: string;
  videoUrl: string;
}

interface ChannelInfo {
  channelName: string;
  channelId: string;
  subscriberCount: number;
  videoCount: number;
  avatarUrl?: string;
}

/**
 * Fetch channel info from the YouTube API using a refresh token.
 */
export const fetchChannelInfo = async (
  refreshToken: string,
): Promise<ChannelInfo> => {
  oauth2Client.setCredentials({ refresh_token: refreshToken });
  const youtube = google.youtube({ version: "v3", auth: oauth2Client });
  const res = await youtube.channels.list({
    part: ["snippet", "statistics"],
    mine: true,
  });

  const channel = res.data.items?.[0];
  if (!channel) {
    throw new Error("No channel found for this account");
  }

  return {
    channelName: channel.snippet?.title ?? "Unknown Channel",
    channelId: channel.id!,
    subscriberCount: parseInt(channel.statistics?.subscriberCount || "0"),
    videoCount: parseInt(channel.statistics?.videoCount || "0"),
    avatarUrl: channel.snippet?.thumbnails?.default?.url ?? undefined,
  };
};

/**
 * Verify that a refresh token is still valid by fetching the channel list.
 */
export const verifyToken = async (
  refreshToken: string,
): Promise<{ valid: boolean; channelName?: string; error?: string }> => {
  try {
    const info = await fetchChannelInfo(refreshToken);
    return {
      valid: true,
      channelName: info.channelName,
    };
  } catch (err: any) {
    const msg = err?.message || "Unknown error";
    if (err?.response?.status === 401 || err?.response?.status === 403) {
      return { valid: false, error: "Token revoked or invalid" };
    }
    return { valid: false, error: msg };
  }
};

/**
 * Upload an MP4 file to YouTube using the user's default video settings.
 *
 * @param filePath     Local path to the MP4 file
 * @param title        YouTube video title
 * @param description  YouTube video description
 * @param refreshToken OAuth refresh token for the target channel
 * @param options      Override privacy, category, language from user settings
 */
export const uploadVideo = async (
  filePath: string,
  title: string,
  description: string,
  refreshToken: string,
  options?: UploadOptions,
): Promise<UploadResult> => {
  oauth2Client.setCredentials({ refresh_token: refreshToken });

  const youtube = google.youtube({ version: "v3", auth: oauth2Client });

  const requestBody: any = {
    snippet: {
      title,
      description,
    },
    status: {
      privacyStatus: options?.privacyStatus || "private",
      selfDeclaredMadeForKids: false,
    },
  };

  // Map category name to YouTube category ID
  if (options?.categoryId) {
    requestBody.snippet.categoryId = options.categoryId;
  }

  // Set default language — only if it looks like a valid language code
  // (ISO 639-1 two-letter or locale like en-US). Display names like
  // "English" are rejected by the YouTube API.
  if (
    options?.defaultLanguage &&
    /^[a-z]{2}(-[A-Z]{2})?$/.test(options.defaultLanguage)
  ) {
    requestBody.snippet.defaultLanguage = options.defaultLanguage;
  }

  const res = await youtube.videos
    .insert({
      part: ["snippet", "status"],
      requestBody,
      media: {
        body: fs.createReadStream(filePath),
        mimeType: "video/mp4",
      },
    })
    .catch(async (err: any) => {
      // If privacyStatus "public" fails, retry with "unlisted"
      if (
        requestBody.status?.privacyStatus === "public" &&
        err?.status === 400
      ) {
        console.warn(
          "[YouTube] Public upload failed (channel may not be verified), retrying as unlisted...",
        );
        requestBody.status.privacyStatus = "unlisted";
        const retryRes = await youtube.videos.insert({
          part: ["snippet", "status"],
          requestBody,
          media: {
            body: fs.createReadStream(filePath),
            mimeType: "video/mp4",
          },
        });
        return retryRes;
      }
      throw err;
    });

  const videoId = res.data.id!;
  return {
    videoId,
    videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
  };
};

/**
 * Download a file from a public URL to a local temp path.
 */
export const downloadFromUrl = async (
  url: string,
  destPath: string,
): Promise<void> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download: HTTP ${response.status}`);
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  fs.writeFileSync(destPath, buffer);
};
