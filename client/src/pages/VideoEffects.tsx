import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Sliders,
  Sparkles,
  Type,
  User,
  Palette,
  Move,
  Monitor,
  Maximize2,
  Save,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dropdown } from "@/components/ui/dropdown";
import { Separator } from "@/components/ui/separator";
import {
  getCardLayout,
  getCaptionY,
  type VerticalPlacement,
} from "@/shared/layoutEngine";

// ─── Types ──────────────────────────────────────────────────────────────────

interface VideoEffectsState {
  pfpStyle: "default" | "none" | "custom";
  captionAnimation: "pop-out" | "linear" | "slide" | "fade";
  captionExit: "fade" | "slide-down" | "scale-down" | "none";
  captionColor: string;
  captionOutline: boolean;
  captionOutlineWidth: number;
  cardPlacement: "top" | "center" | "bottom";
  textPlacement: "top" | "center" | "bottom";
}

const DEFAULT_EFFECTS: VideoEffectsState = {
  pfpStyle: "default",
  captionAnimation: "pop-out",
  captionExit: "fade",
  captionColor: "#FFFFFF",
  captionOutline: true,
  captionOutlineWidth: 4,
  cardPlacement: "bottom",
  textPlacement: "center",
};

const CAPTION_ANIMATIONS = [
  { value: "pop-out", label: "Pop Out" },
  { value: "linear", label: "Linear" },
  { value: "slide", label: "Slide In" },
  { value: "fade", label: "Fade In" },
];

const EXIT_ANIMATIONS = [
  { value: "fade", label: "Fade Out" },
  { value: "slide-down", label: "Slide Down" },
  { value: "scale-down", label: "Scale Down" },
  { value: "none", label: "Instant" },
];

const PLACEMENT_OPTIONS = [
  { value: "top", label: "Top" },
  { value: "center", label: "Center" },
  { value: "bottom", label: "Bottom" },
];

const PFP_OPTIONS = [
  { value: "default", label: "Default Reddit" },
  { value: "none", label: "None" },
  { value: "custom", label: "Custom URL" },
];

const COLOR_PRESETS = [
  "#FFFFFF",
  "#FF6B6B",
  "#FFD93D",
  "#6BCB77",
  "#4D96FF",
  "#FF6B9D",
  "#C084FC",
  "#FB923C",
];

const PRESET_PFPS = [
  {
    name: "Snoo",
    src: "https://www.redditstatic.com/avatars/avatar_default_02_7E3E9C.png",
  },
  {
    name: "Dino",
    src: "https://www.redditstatic.com/avatars/avatar_default_04_0DD3BB.png",
  },
  {
    name: "Alien",
    src: "https://www.redditstatic.com/avatars/avatar_default_06_FFB000.png",
  },
  {
    name: "Kitsune",
    src: "https://www.redditstatic.com/avatars/avatar_default_08_FF4500.png",
  },
  {
    name: "Halo",
    src: "https://www.redditstatic.com/avatars/avatar_default_10_7193FF.png",
  },
  {
    name: "Star",
    src: "https://www.redditstatic.com/avatars/avatar_default_12_46A508.png",
  },
];

// ─── Sample content for preview ────────────────────────────────────────────

const SAMPLE_CAPTIONS = [
  "I couldn't believe what happened next...",
  "The store manager actually agreed with me!",
  "Everyone in the restaurant started clapping.",
  "And that's when I knew I had to share this story.",
];

// ─── Editable Setting Row ───────────────────────────────────────────────────

function SettingRow({
  icon: Icon,
  label,
  description,
  children,
}: {
  icon: any;
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 text-[#10b981]" />
        <span className="text-sm font-medium text-[#E8E8E8]">{label}</span>
      </div>
      {description && (
        <p className="text-xs text-[#505050] ml-6">{description}</p>
      )}
      <div className="ml-6">{children}</div>
    </div>
  );
}

// ─── Color Button ───────────────────────────────────────────────────────────

function ColorButton({
  color,
  selected,
  onClick,
}: {
  color: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-8 h-8 rounded-full transition-all ${
        selected
          ? "ring-2 ring-white ring-offset-2 ring-offset-[#0A0A0A] scale-110"
          : "hover:scale-110"
      }`}
      style={{ backgroundColor: color }}
      title={color}
    />
  );
}

// ─── Toggle Switch ──────────────────────────────────────────────────────────

function Toggle({
  value,
  onChange,
}: {
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!value)}
      className={`relative w-10 h-5 rounded-full transition-colors ${value ? "bg-[#10b981]" : "bg-[#252525]"}`}
    >
      <div
        className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
          value ? "translate-x-5" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

// ─── Range Slider ───────────────────────────────────────────────────────────

function RangeSlider({
  value,
  min,
  max,
  step,
  onChange,
  label,
}: {
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  label?: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="flex-1 h-1.5 rounded-full appearance-none cursor-pointer"
        style={{
          background: `linear-gradient(to right, #10b981 ${((value - min) / (max - min)) * 100}%, #252525 ${((value - min) / (max - min)) * 100}%)`,
        }}
      />
      {label && (
        <span className="text-xs text-[#909090] font-mono w-8 text-right">
          {value}
        </span>
      )}
    </div>
  );
}

// ─── Caption Preview Component ──────────────────────────────────────────────

function CaptionPreview({
  text,
  animation,
  color,
  outline,
  outlineWidth,
}: {
  text: string;
  animation: string;
  color: string;
  outline: boolean;
  outlineWidth: number;
}) {
  const animClass =
    animation === "pop-out"
      ? "animate-pulse"
      : animation === "linear"
        ? ""
        : animation === "slide"
          ? "animate-slide-in"
          : "animate-fade-in";

  return (
    <span
      className={`text-lg font-bold text-center px-3 py-1.5 rounded leading-tight ${animClass}`}
      style={{
        color: color,
        textShadow: outline
          ? `0 0 ${outlineWidth}px #000, 0 0 ${outlineWidth}px #000, 0 0 ${outlineWidth * 0.5}px #000`
          : "none",
        fontFamily: "Impact, sans-serif",
        letterSpacing: "0.02em",
      }}
    >
      {text.toUpperCase()}
    </span>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────

export function VideoEffects() {
  const [effects, setEffects] = useState<VideoEffectsState>(DEFAULT_EFFECTS);
  const [currentCaptionIndex, setCurrentCaptionIndex] = useState(0);
  const [customPfpUrl, setCustomPfpUrl] = useState("");
  const [selectedPfpUrl, setSelectedPfpUrl] = useState(PRESET_PFPS[2].src);

  // Free-drag offsets (pixels relative to default position)
  const [captionDrag, setCaptionDrag] = useState({ x: 0, y: 0 });
  const [cardDrag, setCardDrag] = useState({ x: 0, y: 0 });
  const [captionScale, setCaptionScale] = useState(1);
  const [cardScale, setCardScale] = useState(1);
  const [isDragging, setIsDragging] = useState<string | null>(null);

  // ── Shared layout engine (preview = 360x640, full frame = 1080x1920) ──
  const PREVIEW_W = 360;
  const PREVIEW_H = 640;
  const FULL_W = 1080;
  const FULL_H = 1920;

  // Estimate card height at full resolution for preview positioning
  const EST_CARD_HEIGHT = 400;

  const cardLayout = getCardLayout(
    { width: FULL_W, height: FULL_H },
    effects.cardPlacement as VerticalPlacement,
    EST_CARD_HEIGHT,
  );
  const cardXpx = Math.round((cardLayout.x * PREVIEW_W) / FULL_W);
  const cardYPx = Math.round((cardLayout.y * PREVIEW_H) / FULL_H);
  const cardWidthPx = Math.round((cardLayout.width * PREVIEW_W) / FULL_W);

  const captionY = getCaptionY(
    { width: FULL_W, height: FULL_H },
    effects.textPlacement as VerticalPlacement,
  );
  const captionYPx = Math.round((captionY * PREVIEW_H) / FULL_H);

  // ── Load saved effects on mount ────────────────────────────────────────
  const [savedToast, setSavedToast] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/settings", { credentials: "include" });
        if (!res.ok) {
          console.warn("[Effects] Load settings failed:", res.status);
          return;
        }
        const { settings } = await res.json();
        const saved = settings?.video_settings?.effects;
        console.log("[Effects] Raw saved data:", JSON.stringify(saved));
        if (saved) {
          console.log(
            "[Effects] cardPlacement from server:",
            saved.cardPlacement,
          );
          console.log(
            "[Effects] textPlacement from server:",
            saved.textPlacement,
          );
          // Merge saved over defaults (only known keys)
          setEffects((prev) => {
            const merged = { ...prev };
            for (const k of Object.keys(
              DEFAULT_EFFECTS,
            ) as (keyof VideoEffectsState)[]) {
              if (saved[k] !== undefined) {
                (merged as any)[k] = saved[k];
              }
            }
            // Explicitly restore cardPlacement and textPlacement
            if (saved.cardPlacement !== undefined)
              merged.cardPlacement = saved.cardPlacement;
            if (saved.textPlacement !== undefined)
              merged.textPlacement = saved.textPlacement;
            return merged;
          });
        } else {
          console.warn("[Effects] No saved effects found in response");
        }
      } catch (err) {
        console.warn("[Effects] Load settings error:", err);
      }
    })();
  }, []);

  // Auto-cycle sample captions to simulate video playing
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentCaptionIndex((i) => (i + 1) % SAMPLE_CAPTIONS.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  // ── Save effects to server ─────────────────────────────────────────────
  const handleSave = useCallback(async () => {
    console.log("[Effects] Saving effects:", JSON.stringify(effects));
    console.log("[Effects] cardPlacement in save:", effects.cardPlacement);
    console.log("[Effects] textPlacement in save:", effects.textPlacement);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          video_settings: {
            effects: {
              ...effects,
              // Include the selected preset URL so the pipeline can use it
              selectedPfpUrl: selectedPfpUrl,
            },
          },
        }),
      });
      if (!res.ok) throw new Error("Save failed");
      setSavedToast(true);
      setTimeout(() => setSavedToast(false), 2500);
    } catch (err: any) {
      console.error("Save effects error:", err);
      alert("Failed to save effects: " + err.message);
    }
  }, [effects]);

  const update = <K extends keyof VideoEffectsState>(
    key: K,
    value: VideoEffectsState[K],
  ) => {
    setEffects((prev) => ({ ...prev, [key]: value }));
  };

  const displayPfp =
    effects.pfpStyle === "default"
      ? selectedPfpUrl
      : effects.pfpStyle === "custom"
        ? customPfpUrl || selectedPfpUrl
        : null;

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 px-5 py-3 flex items-center justify-between bg-[#0A0A0A] border-b border-[#1A1A1A]">
        <div className="flex items-center gap-3">
          <a
            href="/video"
            className="text-[#505050] hover:text-[#E8E8E8] transition-colors"
            target="_self"
          >
            <ArrowLeft className="w-5 h-5" />
          </a>
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-[#10b981]" />
            <h1 className="text-lg font-semibold text-[#E8E8E8]">
              Video Effects
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors bg-[#10b981]/20 text-[#10b981] hover:bg-[#10b981]/30 border border-[#10b981]/30"
          >
            <Save className="w-3.5 h-3.5" />
            Save
          </button>
          <div className="flex items-center gap-2 text-xs text-[#505050]">
            <Monitor className="w-3.5 h-3.5" />
            <span>Preview</span>
          </div>
        </div>
      </header>

      {/* ── Main Layout ────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col lg:flex-row gap-0 min-h-0">
        {/* ── Preview Panel ────────────────────────────────────────────── */}
        <div className="flex-1 flex items-center justify-center p-6 bg-[#050505] border-r border-[#1A1A1A]">
          <div className="relative w-[360px] h-[640px] rounded-3xl overflow-hidden border-4 border-[#1A1A1A] shadow-2xl shadow-black/50 bg-black">
            {/* Background — solid dark (actual video replaces this) */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a0a] via-[#111] to-[#0a0a0a]" />

            {/* Subtle gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/40" />

            {/* Google Slides-style dot grid — visible while dragging */}
            <motion.div
              animate={{ opacity: isDragging ? 1 : 0 }}
              transition={{ duration: 0.15 }}
              className="absolute inset-0 z-30 pointer-events-none"
              style={{
                backgroundImage:
                  "radial-gradient(circle, rgba(255,255,255,0.4) 1.2px, transparent 1.2px)",
                backgroundSize: "20px 20px",
              }}
            />

            {/* Safe-area padding guides — left & right margins */}
            <motion.div
              animate={{ opacity: isDragging ? 0.5 : 0 }}
              transition={{ duration: 0.15 }}
              className="absolute inset-y-0 left-4 z-30 pointer-events-none w-px bg-white/30"
            />
            <motion.div
              animate={{ opacity: isDragging ? 0.5 : 0 }}
              transition={{ duration: 0.15 }}
              className="absolute inset-y-0 right-4 z-30 pointer-events-none w-px bg-white/30"
            />
            <motion.div
              animate={{ opacity: isDragging ? 0.3 : 0 }}
              transition={{ duration: 0.15 }}
              className="absolute inset-x-0 top-4 z-30 pointer-events-none h-px bg-white/20"
            />
            <motion.div
              animate={{ opacity: isDragging ? 0.3 : 0 }}
              transition={{ duration: 0.15 }}
              className="absolute inset-x-0 bottom-4 z-30 pointer-events-none h-px bg-white/20"
            />

            {/* Snap guide — horizontal center (emerald) */}
            <motion.div
              animate={{ opacity: isDragging ? 0.7 : 0 }}
              transition={{ duration: 0.1 }}
              className="absolute inset-0 z-30 pointer-events-none flex items-center justify-center"
            >
              <div className="w-full h-px bg-[#10b981]/70" />
            </motion.div>
            {/* Snap guide — vertical center (emerald) */}
            <motion.div
              animate={{ opacity: isDragging ? 0.7 : 0 }}
              transition={{ duration: 0.1 }}
              className="absolute inset-0 z-30 pointer-events-none flex items-center justify-center"
            >
              <div className="h-full w-px bg-[#10b981]/70" />
            </motion.div>

            {/* Card — draggable always, snaps to 10px grid */}
            <motion.div
              drag
              dragMomentum={false}
              dragElastic={0}
              onDragStart={() => {
                setIsDragging("card");
                document.body.style.userSelect = "none";
              }}
              onDragEnd={(_, info) => {
                setIsDragging(null);
                document.body.style.userSelect = "";
                const snap = 10;
                let newX =
                  Math.round((cardDrag.x + info.offset.x) / snap) * snap;
                let newY =
                  Math.round((cardDrag.y + info.offset.y) / snap) * snap;
                // Snap to exact center if within 15px
                if (Math.abs(newX) < 15) newX = 0;
                if (Math.abs(newY) < 15) newY = 0;
                setCardDrag({ x: newX, y: newY });
              }}
              animate={{ x: cardDrag.x, y: cardDrag.y }}
              transition={{ type: "spring", stiffness: 400, damping: 35 }}
              className={`absolute z-10 ${
                isDragging === "card"
                  ? "cursor-grabbing ring-2 ring-[#10b981]/40 ring-inset rounded-xl"
                  : "cursor-grab"
              }`}
              style={{
                left: `${cardXpx}px`,
                top: `${cardYPx}px`,
                width: `${cardWidthPx}px`,
                scale: cardScale,
                transformOrigin: "center center",
                touchAction: "none",
              }}
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl p-3 shadow-lg relative group"
                style={{
                  boxShadow:
                    "0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.08)",
                }}
              >
                {/* Resize handle for card */}
                <div
                  className="absolute -bottom-2 -right-2 w-5 h-5 bg-[#10b981] rounded-full cursor-se-resize z-20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    const startY = e.clientY;
                    const startScale = cardScale;
                    const onMove = (ev: MouseEvent) => {
                      ev.preventDefault();
                      const delta = ev.clientY - startY;
                      setCardScale(
                        Math.max(0.5, Math.min(2, startScale + delta * 0.005)),
                      );
                    };
                    const onUp = () => {
                      document.removeEventListener("mousemove", onMove);
                      document.removeEventListener("mouseup", onUp);
                    };
                    document.addEventListener("mousemove", onMove);
                    document.addEventListener("mouseup", onUp);
                  }}
                >
                  <Maximize2 className="w-3 h-3 text-white" />
                </div>
                <div className="flex items-start gap-3">
                  {/* PFP */}
                  {displayPfp && (
                    <div className="w-9 h-9 rounded-full overflow-hidden shrink-0 bg-[#D9D9D9]">
                      <img
                        src={displayPfp}
                        alt="PFP"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            "https://www.redditstatic.com/avatars/avatar_default_02_7E3E9C.png";
                        }}
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-xs font-bold text-[#2E3640]">
                        r/Stories
                      </span>
                      <span className="text-[10px] text-[#5C6C74]">•</span>
                      <span className="text-[10px] text-[#5C6C74]">
                        u/throwaway_8462
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-[#11151A] leading-tight line-clamp-3 mb-0.5">
                      My neighbor left a note on my car that said \"Learn how to
                      park.\" So I left one on his.
                    </p>
                    <p className="text-[11px] text-[#5C6C74] leading-snug line-clamp-2">
                      I can't believe people actually do this. I came out to my
                      car this morning and found a sticky note on my windshield.
                    </p>
                    <div className="flex items-center gap-1.5 mt-2">
                      <span className="inline-flex items-center gap-0.5 px-2 py-1 rounded-md bg-[#F2F4F5] text-[11px] font-semibold text-[#2E3640]">
                        <span className="text-xs leading-none">⬆</span>
                        <span>2.4k</span>
                      </span>
                      <span className="inline-flex items-center gap-0.5 px-2 py-1 rounded-md bg-[#F2F4F5] text-[11px] font-semibold text-[#2E3640]">
                        <span className="text-xs leading-none">💬</span>
                        <span>89</span>
                      </span>
                      <span className="inline-flex items-center gap-0.5 px-2 py-1 rounded-md bg-[#F2F4F5] text-[11px] font-semibold text-[#2E3640]">
                        <span className="text-xs leading-none">🏆</span>
                      </span>
                      <span className="inline-flex items-center gap-0.5 px-2 py-1 rounded-md bg-[#F2F4F5] text-[11px] font-semibold text-[#2E3640]">
                        <span className="text-xs leading-none">↗</span>
                        <span>Share</span>
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>

            {/* Caption area — draggable */}
            <motion.div
              drag
              dragMomentum={false}
              dragElastic={0}
              onDragStart={() => {
                setIsDragging("caption");
                document.body.style.userSelect = "none";
              }}
              onDragEnd={(_, info) => {
                setIsDragging(null);
                document.body.style.userSelect = "";
                const snap = 10;
                let newX =
                  Math.round((captionDrag.x + info.offset.x) / snap) * snap;
                let newY =
                  Math.round((captionDrag.y + info.offset.y) / snap) * snap;
                // Snap to exact center if within 15px
                if (Math.abs(newX) < 15) newX = 0;
                if (Math.abs(newY) < 15) newY = 0;
                setCaptionDrag({ x: newX, y: newY });
              }}
              animate={{ x: captionDrag.x, y: captionDrag.y }}
              transition={{ type: "spring", stiffness: 400, damping: 35 }}
              className={`absolute left-4 right-4 z-20 ${
                isDragging === "caption"
                  ? "cursor-grabbing ring-2 ring-[#10b981]/40 ring-inset rounded-lg"
                  : "cursor-grab"
              }`}
              style={{
                top: `${captionYPx}px`,
                touchAction: "none",
              }}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentCaptionIndex}
                  initial={
                    effects.captionAnimation === "slide"
                      ? { x: 80, opacity: 0 }
                      : effects.captionAnimation === "fade"
                        ? { opacity: 0 }
                        : { scale: 0.8, opacity: 0 }
                  }
                  animate={
                    effects.captionAnimation === "pop-out"
                      ? { scale: 1, opacity: 1 }
                      : effects.captionAnimation === "slide"
                        ? { x: 0, opacity: 1 }
                        : { opacity: 1 }
                  }
                  exit={
                    effects.captionExit === "fade"
                      ? { opacity: 0 }
                      : effects.captionExit === "slide-down"
                        ? { y: 40, opacity: 0 }
                        : effects.captionExit === "scale-down"
                          ? { scale: 0.8, opacity: 0 }
                          : { opacity: 1, transition: { duration: 0 } }
                  }
                  transition={{ duration: 0.3 }}
                  className="flex justify-center relative group"
                >
                  {/* Resize handle for caption */}
                  <div
                    className="absolute -bottom-2 -right-2 w-5 h-5 bg-[#10b981] rounded-full cursor-nw-resize z-20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      const startY = e.clientY;
                      const startScale = captionScale;
                      const onMove = (ev: MouseEvent) => {
                        ev.preventDefault();
                        const delta = ev.clientY - startY;
                        setCaptionScale(
                          Math.max(
                            0.5,
                            Math.min(2, startScale + delta * 0.005),
                          ),
                        );
                      };
                      const onUp = () => {
                        document.removeEventListener("mousemove", onMove);
                        document.removeEventListener("mouseup", onUp);
                      };
                      document.addEventListener("mousemove", onMove);
                      document.addEventListener("mouseup", onUp);
                    }}
                  >
                    <Maximize2 className="w-3 h-3 text-white" />
                  </div>
                  <div style={{ scale: captionScale }}>
                    <CaptionPreview
                      text={SAMPLE_CAPTIONS[currentCaptionIndex]}
                      animation={effects.captionAnimation}
                      color={effects.captionColor}
                      outline={effects.captionOutline}
                      outlineWidth={effects.captionOutlineWidth}
                    />
                  </div>
                </motion.div>
              </AnimatePresence>
            </motion.div>

            {/* Top status bar mockup */}
            <div className="absolute top-0 inset-x-0 h-12 bg-gradient-to-b from-black/60 to-transparent pointer-events-none" />
            <div className="absolute top-3 left-5 text-[10px] text-white/60 font-medium pointer-events-none">
              0:00 / 0:40
            </div>
          </div>
        </div>

        {/* ── Controls Panel ───────────────────────────────────────────── */}
        <div className="w-full lg:w-96 max-h-[calc(100vh-56px)] overflow-y-auto bg-[#0A0A0A]">
          <div className="p-5 space-y-6">
            {/* ── Caption Style ─────────────────────────────────────────── */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Type className="w-4 h-4 text-[#10b981]" />
                <h2 className="text-sm font-semibold text-[#E8E8E8]">
                  Caption Style
                </h2>
              </div>
              <div className="space-y-4 pl-6">
                <SettingRow
                  icon={Sparkles}
                  label="Entrance"
                  description="How words enter the frame"
                >
                  <Dropdown
                    options={CAPTION_ANIMATIONS}
                    value={effects.captionAnimation}
                    onChange={(v) =>
                      update(
                        "captionAnimation",
                        v as VideoEffectsState["captionAnimation"],
                      )
                    }
                  />
                </SettingRow>

                <SettingRow
                  icon={Sparkles}
                  label="Exit"
                  description="How words leave the frame"
                >
                  <Dropdown
                    options={EXIT_ANIMATIONS}
                    value={effects.captionExit}
                    onChange={(v) =>
                      update(
                        "captionExit",
                        v as VideoEffectsState["captionExit"],
                      )
                    }
                  />
                </SettingRow>

                <SettingRow icon={Palette} label="Color">
                  <div className="flex flex-wrap gap-2">
                    {COLOR_PRESETS.map((c) => (
                      <ColorButton
                        key={c}
                        color={c}
                        selected={effects.captionColor === c}
                        onClick={() => update("captionColor", c)}
                      />
                    ))}
                    <input
                      type="color"
                      value={effects.captionColor}
                      onChange={(e) => update("captionColor", e.target.value)}
                      className="w-8 h-8 rounded-full cursor-pointer border-0 bg-transparent"
                    />
                  </div>
                </SettingRow>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 flex items-center justify-center">
                      <div className="w-3.5 h-3.5 rounded border border-[#505050] flex items-center justify-center">
                        <span className="text-[8px] text-[#505050] font-bold">
                          A
                        </span>
                      </div>
                    </div>
                    <span className="text-sm text-[#E8E8E8]">Outline</span>
                  </div>
                  <div className="flex items-center gap-3">
                    {effects.captionOutline && (
                      <RangeSlider
                        value={effects.captionOutlineWidth}
                        min={1}
                        max={8}
                        step={1}
                        onChange={(v) => update("captionOutlineWidth", v)}
                        label=""
                      />
                    )}
                    <Toggle
                      value={effects.captionOutline}
                      onChange={(v) => update("captionOutline", v)}
                    />
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* ── Reddit Card ───────────────────────────────────────────── */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <User className="w-4 h-4 text-[#10b981]" />
                <h2 className="text-sm font-semibold text-[#E8E8E8]">
                  Reddit Card
                </h2>
              </div>
              <div className="space-y-4 pl-6">
                <SettingRow
                  icon={User}
                  label="Profile Picture"
                  description="Avatar shown in the Reddit card"
                >
                  <Dropdown
                    options={PFP_OPTIONS}
                    value={effects.pfpStyle}
                    onChange={(v) =>
                      update("pfpStyle", v as VideoEffectsState["pfpStyle"])
                    }
                  />
                  {effects.pfpStyle === "custom" && (
                    <input
                      type="text"
                      placeholder="Paste image URL..."
                      value={customPfpUrl}
                      onChange={(e) => setCustomPfpUrl(e.target.value)}
                      className="w-full mt-2 px-3 py-2 rounded-lg text-sm bg-[#1A1A1A] border border-[#1A1A1A] text-[#E8E8E8] placeholder-[#505050] focus:border-[#10b981] focus:outline-none transition-colors"
                    />
                  )}
                  {effects.pfpStyle === "default" && (
                    <div className="flex gap-2 mt-2 flex-wrap">
                      {PRESET_PFPS.slice(0, 6).map((pfp, i) => (
                        <button
                          key={i}
                          onClick={() => setSelectedPfpUrl(pfp.src)}
                          className={`w-8 h-8 rounded-full overflow-hidden border-2 transition-all ${
                            selectedPfpUrl === pfp.src
                              ? "border-[#10b981] ring-1 ring-[#10b981]/30"
                              : "border-[#252525] hover:border-[#505050]"
                          }`}
                          title={pfp.name}
                        >
                          <img
                            src={pfp.src}
                            alt={pfp.name}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </SettingRow>

                <SettingRow
                  icon={Move}
                  label="Card Placement"
                  description="Vertical position of the Reddit card"
                >
                  <Dropdown
                    options={PLACEMENT_OPTIONS}
                    value={effects.cardPlacement}
                    onChange={(v) => {
                      update(
                        "cardPlacement",
                        v as VideoEffectsState["cardPlacement"],
                      );
                      setCardDrag({ x: 0, y: 0 });
                    }}
                  />
                </SettingRow>
              </div>
            </div>

            <Separator />

            {/* ── Text Placement ────────────────────────────────────────── */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Move className="w-4 h-4 text-[#10b981]" />
                <h2 className="text-sm font-semibold text-[#E8E8E8]">
                  Caption
                </h2>
              </div>
              <div className="pl-6">
                <SettingRow
                  icon={Move}
                  label="Vertical Position"
                  description="Where captions appear on screen"
                >
                  <Dropdown
                    options={PLACEMENT_OPTIONS}
                    value={effects.textPlacement}
                    onChange={(v) => {
                      update(
                        "textPlacement",
                        v as VideoEffectsState["textPlacement"],
                      );
                      setCaptionDrag({ x: 0, y: 0 });
                    }}
                  />
                </SettingRow>
              </div>
            </div>

            {/* ── Reset buttons ────────────────────────────────────────── */}
            <div className="pt-2 pb-6 space-y-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setEffects(DEFAULT_EFFECTS)}
                className="w-full"
              >
                Reset to Defaults
              </Button>
              <button
                onClick={() => {
                  setCardDrag({ x: 0, y: 0 });
                  setCaptionDrag({ x: 0, y: 0 });
                  setCardScale(1);
                  setCaptionScale(1);
                }}
                className="w-full px-3 py-2 rounded-lg text-xs font-medium bg-[#1A1A1A] text-[#909090] hover:bg-[#252525] transition-colors"
              >
                Reset Positions
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Inject CSS animations ──────────────────────────────────────── */}
      <style>{`
        @keyframes slide-in {
          from { transform: translateX(60px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-slide-in {
          animation: slide-in 0.5s ease-out;
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #10b981;
          cursor: pointer;
          border: 2px solid #0A0A0A;
          box-shadow: 0 0 0 1px #10b981;
        }
        input[type="range"]::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #10b981;
          cursor: pointer;
          border: 2px solid #0A0A0A;
          box-shadow: 0 0 0 1px #10b981;
        }
        input[type="color"]::-webkit-color-swatch-wrapper {
          padding: 0;
        }
        input[type="color"]::-webkit-color-swatch {
          border: 2px solid #252525;
          border-radius: 50%;
        }
      `}</style>

      {/* ── Saved toast ──────────────────────────────────────────── */}
      <AnimatePresence>
        {savedToast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#10b981] text-white px-5 py-3 rounded-lg text-sm font-medium shadow-xl flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            Effects saved
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
