/**
 * API base URL — points to the Render backend.
 * In development, Vite proxies /api and /auth to localhost:5000.
 * In production (Vercel), this hits Render directly.
 */
const API_BASE = import.meta.env.VITE_API_URL || "https://post-rtc8.onrender.com";

/**
 * Fetch wrapper that prepends the API base URL and includes credentials.
 */
export async function apiFetch(
  path: string,
  options: RequestInit = {},
): Promise<Response> {
  const url = `${API_BASE}${path}`;
  return fetch(url, {
    ...options,
    credentials: "include",
  });
}
