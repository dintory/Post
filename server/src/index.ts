import express from "express";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import authRoutes from "./routes/auth";
import videoRoutes from "./routes/video";
import accountRoutes from "./routes/accounts";
import settingsRoutes from "./routes/settings";
import youtubeRoutes from "./routes/youtube";
import automationRoutes from "./routes/automation";
import { ensureBackgroundVideo } from "./utils/ensureBackground";
import fs from "fs";
import path from "path";
import os from "os";

dotenv.config();

// Clean up temp directory on startup (free disk space / memory)
const tempDir = path.join(os.tmpdir(), "commissioner");
try {
  if (fs.existsSync(tempDir)) {
    const files = fs.readdirSync(tempDir);
    for (const file of files) {
      try {
        fs.unlinkSync(path.join(tempDir, file));
      } catch {}
    }
    console.log(
      `[Startup] Cleaned ${files.length} temp file(s) from ${tempDir}`,
    );
  }
} catch (err) {
  console.warn("[Startup] Could not clean temp dir:", err);
}

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
// Manual CORS: always set headers before any processing, handle OPTIONS immediately.
// This is more reliable than the cors() package for error responses on Render.
const ALLOWED_ORIGINS = [
  "http://localhost:5173",
  "https://post-rtc8.onrender.com",
  ...(process.env.CORS_ORIGINS || "").split(",").filter(Boolean),
];

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin) {
    const allowed =
      origin.endsWith(".vercel.app") || ALLOWED_ORIGINS.includes(origin);
    if (allowed) {
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Access-Control-Allow-Credentials", "true");
      res.setHeader(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization",
      );
      res.setHeader(
        "Access-Control-Allow-Methods",
        "GET, POST, PUT, PATCH, DELETE, OPTIONS",
      );
    }
  }
  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }
  next();
});

app.use(express.json());
app.use(cookieParser());

// Routes
app.use("/auth", authRoutes);
app.use("/api/video", videoRoutes);
app.use("/api/accounts", accountRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/", youtubeRoutes);
app.use("/api/automation", automationRoutes);

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date() });
});

// Start Server (wait for background video before accepting connections)
async function start() {
  // Log memory at startup for debugging
  const memMB = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(1);
  const rssMB = (process.memoryUsage().rss / 1024 / 1024).toFixed(1);
  console.log(
    `[Startup] Memory: ${memMB}MB heap / ${rssMB}MB RSS (limit: ${process.env.NODE_OPTIONS || "none"})`,
  );

  // Periodically log memory so we can track leaks
  setInterval(() => {
    const m = process.memoryUsage();
    const heap = (m.heapUsed / 1024 / 1024).toFixed(1);
    const rss = (m.rss / 1024 / 1024).toFixed(1);
    if (parseFloat(heap) > 300 || parseFloat(rss) > 400) {
      console.warn(`[Memory] WARN: ${heap}MB heap / ${rss}MB RSS`);
    }
  }, 30_000);

  await ensureBackgroundVideo();
  app.listen(PORT, () => {
    const baseUrl = process.env.APP_URL || `http://localhost:${PORT}`;
    console.log(`Server is running on ${baseUrl}`);
  });
}

start();
