import fs from "fs";
import path from "path";
import https from "https";
import { getBackgroundUrl } from "./r2";

const LOCAL_BACKGROUND_PATH = path.join(
  __dirname,
  "../../backgrounds/reddit/minecraft-parkour.mp4",
);

/**
 * Ensure the default Minecraft Parkour background video exists locally.
 * If missing, download it from R2.
 */
export const ensureBackgroundVideo = async (): Promise<void> => {
  if (fs.existsSync(LOCAL_BACKGROUND_PATH)) {
    console.log("[Startup] Background video already exists locally.");
    return;
  }

  console.log("[Startup] Downloading background video from R2...");

  const dir = path.dirname(LOCAL_BACKGROUND_PATH);
  fs.mkdirSync(dir, { recursive: true });

  const url = getBackgroundUrl();

  await new Promise<void>((resolve, reject) => {
    https
      .get(url, (response) => {
        if (response.statusCode !== 200) {
          reject(
            new Error(
              `Failed to download background: HTTP ${response.statusCode}`,
            ),
          );
          return;
        }
        const file = fs.createWriteStream(LOCAL_BACKGROUND_PATH);
        response.pipe(file);
        file.on("finish", () => {
          file.close();
          console.log("[Startup] Background video ready.");
          resolve();
        });
        file.on("error", (err) => {
          fs.unlinkSync(LOCAL_BACKGROUND_PATH);
          reject(err);
        });
      })
      .on("error", (err) => {
        reject(err);
      });
  });
};
