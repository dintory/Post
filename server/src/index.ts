import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import authRoutes from "./routes/auth";
import videoRoutes from "./routes/video";
import accountRoutes from "./routes/accounts";
import settingsRoutes from "./routes/settings";
import youtubeRoutes from "./routes/youtube";
import automationRoutes from "./routes/automation";
import { ensureBackgroundVideo } from "./utils/ensureBackground";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: (origin: string | undefined, cb: any) => {
      // Allow requests with no origin (server-to-server, curl, etc.)
      if (!origin) return cb(null, true);

      const allowed = [
        "http://localhost:5173",
        "https://post-rtc8.onrender.com",
        ...(process.env.CORS_ORIGINS || "").split(",").filter(Boolean),
      ];

      // Allow any Vercel deployment URL (*.vercel.app)
      if (origin.endsWith(".vercel.app")) return cb(null, true);

      if (allowed.includes(origin)) return cb(null, true);

      console.warn(`[CORS] Blocked origin: ${origin}`);
      cb(new Error("Not allowed by CORS"));
    },
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

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
  await ensureBackgroundVideo();
  app.listen(PORT, () => {
    const baseUrl = process.env.APP_URL || `http://localhost:${PORT}`;
    console.log(`Server is running on ${baseUrl}`);
  });
}

start();
