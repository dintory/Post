import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import authRoutes from "./routes/auth";
import videoRoutes from "./routes/video";
import accountRoutes from "./routes/accounts";
import settingsRoutes from "./routes/settings";
import youtubeRoutes from "./routes/youtube";
import { ensureBackgroundVideo } from "./utils/ensureBackground";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: [
      "http://localhost:5173", // Vite dev server
      "https://post-rtc8.onrender.com", // Render backend
      "https://post-mu-navy.vercel.app", // Vercel production
      ...(process.env.CORS_ORIGINS || "").split(",").filter(Boolean),
    ],
    credentials: true,
  }),
);

// Routes
app.use("/auth", authRoutes);
app.use("/api/video", videoRoutes);
app.use("/api/accounts", accountRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/", youtubeRoutes);

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
