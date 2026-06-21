/**
 * Loads font files for Satori rendering.
 * Downloads IBM Plex Sans from Google Fonts at startup and caches in memory.
 */
import fs from "fs";
import path from "path";

interface FontData {
  name: string;
  weight: 400 | 700;
  data: ArrayBuffer;
}

let cachedFonts: FontData[] | null = null;

const FONTS_DIR = path.resolve(__dirname, "../../fonts");

// Google Fonts CSS URL for IBM Plex Sans
const GOOGLE_FONTS_URL =
  "https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;700&display=swap";

async function downloadWoff(url: string): Promise<ArrayBuffer> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Font download failed: ${res.status}`);
  return res.arrayBuffer();
}

/** Parse Google Fonts CSS response to extract woff2 URLs */
function parseFontCssUrls(css: string): { url: string; weight: number }[] {
  const results: { url: string; weight: number }[] = [];
  const blocks = css.split(/@font-face\s*\{/g);
  for (const block of blocks) {
    const weightMatch = block.match(/font-weight:\s*(\d+)/);
    const srcMatch = block.match(/url\(([^)]+)\)/);
    if (weightMatch && srcMatch) {
      results.push({ url: srcMatch[1], weight: parseInt(weightMatch[1]) });
    }
  }
  return results;
}

export async function loadFonts(): Promise<FontData[]> {
  if (cachedFonts) return cachedFonts;

  // Try loading from local disk first
  const localRegular = path.join(FONTS_DIR, "IBMPlexSans-Regular.woff2");
  const localBold = path.join(FONTS_DIR, "IBMPlexSans-Bold.woff2");

  if (fs.existsSync(localRegular) && fs.existsSync(localBold)) {
    cachedFonts = [
      { name: "IBM Plex Sans", weight: 400, data: fs.readFileSync(localRegular).buffer },
      { name: "IBM Plex Sans", weight: 700, data: fs.readFileSync(localBold).buffer },
    ];
    return cachedFonts;
  }

  // Download from Google Fonts
  console.log("[Fonts] Downloading IBM Plex Sans from Google Fonts...");
  const cssRes = await fetch(GOOGLE_FONTS_URL);
  const css = await cssRes.text();
  const entries = parseFontCssUrls(css);

  if (entries.length === 0) throw new Error("Could not parse Google Fonts CSS");

  const fonts: FontData[] = [];
  for (const entry of entries) {
    const data = await downloadWoff(entry.url);
    fonts.push({
      name: "IBM Plex Sans",
      weight: entry.weight as 400 | 700,
      data,
    });
  }

  // Cache locally for next time
  try {
    if (!fs.existsSync(FONTS_DIR)) fs.mkdirSync(FONTS_DIR, { recursive: true });
    for (const font of fonts) {
      const ext = font.weight === 700 ? "Bold" : "Regular";
      fs.writeFileSync(path.join(FONTS_DIR, `IBMPlexSans-${ext}.woff2`), Buffer.from(font.data));
    }
  } catch (e) {
    console.warn("[Fonts] Could not cache fonts locally:", e);
  }

  cachedFonts = fonts;
  console.log(`[Fonts] Loaded ${fonts.length} font(s)`);
  return fonts;
}
