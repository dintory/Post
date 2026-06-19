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
  window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
    const url =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.toString()
          : "url" in input
            ? input.url
            : "";
    // Only rewrite relative paths starting with /api/ or /auth/
    if (
      typeof url === "string" &&
      (url.startsWith("/api/") || url.startsWith("/auth/"))
    ) {
      return originalFetch(`${API_BASE}${url}`, init);
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
