import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import dotenv from "dotenv";

dotenv.config();

const accountId = process.env.R2_ACCOUNT_ID;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
const bucketName = process.env.R2_BUCKET_NAME || "video-pipeline";
const endpoint = process.env.R2_ENDPOINT;
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL;

if (!accessKeyId || !secretAccessKey || !endpoint) {
  console.warn(
    "R2 Storage credentials are not fully defined in environment variables.",
  );
}

export const r2Client = new S3Client({
  region: "auto",
  endpoint: endpoint,
  credentials: {
    accessKeyId: accessKeyId || "",
    secretAccessKey: secretAccessKey || "",
  },
});

export const uploadToR2 = async (
  key: string,
  body: Buffer | Uint8Array | Blob | string,
  contentType: string = "video/mp4",
) => {
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: body,
    ContentType: contentType,
  });

  await r2Client.send(command);

  // Return the public/presigned or access URL
  // The standard R2 access URL (if public) or standard endpoint URL
  return `${endpoint}/${bucketName}/${key}`;
};

export const deleteFromR2 = async (key: string) => {
  const command = new DeleteObjectCommand({
    Bucket: bucketName,
    Key: key,
  });

  await r2Client.send(command);
};

/**
 * Upload a local video file to R2 under videos/<jobId>.mp4
 * and return the public URL.
 */
export const uploadVideo = async (
  filePath: string,
  jobId: string,
): Promise<string> => {
  const fs = await import("fs");
  const videoBuffer = fs.readFileSync(filePath);
  const key = `videos/${jobId}.mp4`;

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: videoBuffer,
    ContentType: "video/mp4",
  });

  await r2Client.send(command);

  const publicUrl = `${R2_PUBLIC_URL}/${key}`;
  console.log(`[R2] Uploaded video to: ${publicUrl}`);
  return publicUrl;
};

/**
 * Return the public R2 URL for the default background video.
 */
export const getBackgroundUrl = (): string => {
  return `${R2_PUBLIC_URL}/backgrounds/minecraft-parkour.mp4`;
};
