import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";

// ─── API Base URL ────────────────────────────────────────────────────────────
// In production (Vercel), relative /api/* and /auth/* calls need to reach Render.
// In dev, Vite proxies these to localhost:5000, so the override is transparent.
const API_BASE =
  import.meta.env.VITE_API_URL || "https://post-rtc8.onrender.com";

if (API_BASE) {
  const originalFetch = window.fetch.bind(window);

  async function refreshAccessToken(): Promise<string | null> {
    const refreshToken = localStorage.getItem("refresh_token");
    if (!refreshToken) return null;
    try {
      const supabaseUrl =
        import.meta.env.VITE_SUPABASE_URL ||
        "https://hbqwsanncmfvbnvnwxgm.supabase.co";
      const anonKey =
        import.meta.env.VITE_SUPABASE_ANON_KEY ||
        "sb_publishable_uHaV-A4k6-jpvXNeWtOZBA_vwZQt1dz";
      const res = await fetch(
        `${supabaseUrl}/auth/v1/token?grant_type=refresh_token`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", apikey: anonKey },
          body: JSON.stringify({ refresh_token: refreshToken }),
        },
      );
      if (!res.ok) return null;
      const data = await res.json();
      if (data.access_token) {
        localStorage.setItem("access_token", data.access_token);
        if (data.refresh_token)
          localStorage.setItem("refresh_token", data.refresh_token);
        return data.access_token;
      }
      return null;
    } catch {
      return null;
    }
  }

  window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
    const url =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.toString()
          : "url" in input
            ? input.url
            : "";

    if (
      typeof url === "string" &&
      (url.startsWith("/api/") || url.startsWith("/auth/"))
    ) {
      const makeRequest = (token?: string) => {
        const headers = new Headers(init?.headers);
        if (token) headers.set("Authorization", `Bearer ${token}`);
        return originalFetch(`${API_BASE}${url}`, { ...init, headers });
      };

      const token = localStorage.getItem("access_token");
      const response = makeRequest(token || undefined);

      // If 401, try refreshing the token and retry once
      return response.then(async (res) => {
        if (res.status === 401 && localStorage.getItem("refresh_token")) {
          const newToken = await refreshAccessToken();
          if (newToken) {
            // Retry the request with the new token
            return makeRequest(newToken);
          }
        }
        return res;
      });
    }

    return originalFetch(input, init);
  };
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);
