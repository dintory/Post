import { Request, Response, NextFunction } from "express";
import { supabase } from "../config/supabase";

export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  // Check Authorization header first (Bearer token), then cookie, then query param
  // (query param is used by <video> and <a download> which can't set headers).
  const authHeader = req.headers.authorization;
  const token =
    (authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : undefined) ||
    req.cookies.access_token ||
    (req.query.token as string | undefined);

  if (!token) {
    return res
      .status(401)
      .json({ error: "Unauthorized: No session token provided" });
  }

  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    return res
      .status(401)
      .json({ error: "Unauthorized: Invalid session token" });
  }

  // @ts-ignore
  req.user = data.user;
  // @ts-ignore
  req.token = token;
  next();
};
