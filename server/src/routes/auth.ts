import { Router } from "express";
import { supabase } from "../config/supabase";
import { requireAuth } from "../middleware/requireAuth";

const router = Router();

// Configuration for cookies
// In production, frontend (Vercel) and backend (Render) are on different origins,
// so we need SameSite=None + Secure for cross-site cookie to work.
const isProduction = process.env.NODE_ENV === "production";
const cookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: (isProduction ? "none" : "lax") as "none" | "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

const INVITE_CODE = process.env.INVITE_CODE;

router.post("/signup", async (req, res) => {
  const { email, password, inviteCode } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  if (inviteCode !== INVITE_CODE) {
    return res.status(403).json({ error: "Invalid invite code" });
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  return res.status(200).json({
    message:
      "Signup successful. Please check your email to verify your account.",
    user: data.user,
  });
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  // Return the token in the response body so the frontend can
  // send it as an Authorization header (cross-origin compatible).
  // Also set as cookie for same-origin / dev environments.
  if (data.session) {
    res.cookie("access_token", data.session.access_token, cookieOptions);
    res.cookie("refresh_token", data.session.refresh_token, cookieOptions);
  }

  return res.status(200).json({
    message: "Login successful",
    user: data.user,
    access_token: data.session?.access_token,
  });
});

router.post("/logout", (req, res) => {
  res.clearCookie("access_token");
  res.clearCookie("refresh_token");
  return res.status(200).json({ message: "Logged out successfully" });
});

router.get("/me", requireAuth, (req, res) => {
  // @ts-ignore
  return res.status(200).json({ user: req.user });
});

export default router;
