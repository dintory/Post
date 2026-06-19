import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Sliders,
  Sparkles,
  Type,
  Image,
  User,
  Palette,
  Move,
  Layers,
  Monitor,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dropdown } from "@/components/ui/dropdown";
import { Separator } from "@/components/ui/separator";

// ─── Types ──────────────────────────────────────────────────────────────────

interface VideoEffectsState {
  pfpStyle: "default" | "none" | "custom";
  captionAnimation: "pop-out" | "linear" | "slide" | "fade";
  captionColor: string;
  captionOutline: boolean;
  captionOutlineWidth: number;
  cardPlacement: "top" | "center" | "bottom";
  textPlacement: "top" | "center" | "bottom";
  backgroundImage: string;
  backgroundBlur: number;
}

const DEFAULT_EFFECTS: VideoEffectsState = {
  pfpStyle: "default",
  captionAnimation: "pop-out",
  captionColor: "#FFFFFF",
  captionOutline: true,
  captionOutlineWidth: 4,
  cardPlacement: "bottom",
  textPlacement: "center",
  backgroundImage: "/dintory-dintoryware.png",
  backgroundBlur: 0,
};

const CAPTION_ANIMATIONS = [
  { value: "pop-out", label: "Pop Out" },
  { value: "linear", label: "Linear" },
  { value: "slide", label: "Slide In" },
  { value: "fade", label: "Fade In" },
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
  const [customBgUrl, setCustomBgUrl] = useState("");

  // Auto-cycle sample captions to simulate video playing
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentCaptionIndex((i) => (i + 1) % SAMPLE_CAPTIONS.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

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
        <div className="flex items-center gap-2 text-xs text-[#505050]">
          <Monitor className="w-3.5 h-3.5" />
          <span>Real-time preview</span>
        </div>
      </header>

      {/* ── Main Layout ────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col lg:flex-row gap-0">
        {/* ── Preview Panel ────────────────────────────────────────────── */}
        <div className="flex-1 flex items-center justify-center p-6 bg-[#050505] border-r border-[#1A1A1A]">
          <div className="relative w-[360px] h-[640px] rounded-3xl overflow-hidden border-4 border-[#1A1A1A] shadow-2xl shadow-black/50 bg-black">
            {/* Background */}
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage: `url(${effects.backgroundImage || "/dintory-dintoryware.png"})`,
                filter: `blur(${effects.backgroundBlur}px)`,
                transform: "scale(1.05)",
              }}
            />

            {/* Subtle gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/40" />

            {/* Card placement zone */}
            <div
              className={`absolute left-4 right-4 ${
                effects.cardPlacement === "top"
                  ? "top-16"
                  : effects.cardPlacement === "center"
                    ? "top-1/2 -translate-y-1/2"
                    : "bottom-24"
              }`}
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl p-3 shadow-lg"
                style={{
                  boxShadow:
                    "0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.08)",
                }}
              >
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
                    <div className="flex items-center gap-2 mt-2">
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-[#F2F4F5] text-[11px] font-semibold text-[#2E3640]">
                        <span>⬆</span> 2.4k
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-[#F2F4F5] text-[11px] font-semibold text-[#2E3640]">
                        <span>💬</span> 89
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Caption area */}
            <div
              className={`absolute left-4 right-4 ${
                effects.textPlacement === "top"
                  ? "top-4"
                  : effects.textPlacement === "center"
                    ? "top-1/2"
                    : "bottom-4"
              }`}
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
                      ? { scale: [1, 1.06, 1], opacity: 1 }
                      : { x: 0, opacity: 1 }
                  }
                  exit={
                    effects.captionAnimation === "fade"
                      ? { opacity: 0 }
                      : { opacity: 0, y: -10 }
                  }
                  transition={{ duration: 0.4 }}
                  className="flex justify-center"
                >
                  <CaptionPreview
                    text={SAMPLE_CAPTIONS[currentCaptionIndex]}
                    animation={effects.captionAnimation}
                    color={effects.captionColor}
                    outline={effects.captionOutline}
                    outlineWidth={effects.captionOutlineWidth}
                  />
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Top status bar mockup */}
            <div className="absolute top-0 inset-x-0 h-12 bg-gradient-to-b from-black/60 to-transparent pointer-events-none" />
            <div className="absolute top-3 left-5 text-[10px] text-white/60 font-medium pointer-events-none">
              0:00 / 0:40
            </div>
          </div>
        </div>

        {/* ── Controls Panel ───────────────────────────────────────────── */}
        <div className="w-full lg:w-96 overflow-y-auto bg-[#0A0A0A]">
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
                  label="Animation"
                  description="How each word enters the frame"
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
                    onChange={(v) =>
                      update(
                        "cardPlacement",
                        v as VideoEffectsState["cardPlacement"],
                      )
                    }
                  />
                </SettingRow>
              </div>
            </div>

            <Separator />

            {/* ── Background ────────────────────────────────────────────── */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Image className="w-4 h-4 text-[#10b981]" />
                <h2 className="text-sm font-semibold text-[#E8E8E8]">
                  Background
                </h2>
              </div>
              <div className="space-y-4 pl-6">
                <SettingRow
                  icon={Image}
                  label="Image"
                  description="Background image for the video"
                >
                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        update("backgroundImage", "/dintory-dintoryware.png")
                      }
                      className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                        effects.backgroundImage === "/dintory-dintoryware.png"
                          ? "bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/30"
                          : "bg-[#1A1A1A] text-[#909090] border border-[#1A1A1A] hover:border-[#252525]"
                      }`}
                    >
                      Default
                    </button>
                    <button
                      onClick={() => update("backgroundImage", "")}
                      className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                        effects.backgroundImage === ""
                          ? "bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/30"
                          : "bg-[#1A1A1A] text-[#909090] border border-[#1A1A1A] hover:border-[#252525]"
                      }`}
                    >
                      None
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="Or paste image URL..."
                    value={customBgUrl}
                    onChange={(e) => {
                      setCustomBgUrl(e.target.value);
                      if (e.target.value)
                        update("backgroundImage", e.target.value);
                    }}
                    className="w-full px-3 py-2 rounded-lg text-sm bg-[#1A1A1A] border border-[#1A1A1A] text-[#E8E8E8] placeholder-[#505050] focus:border-[#10b981] focus:outline-none transition-colors"
                  />
                </SettingRow>

                <SettingRow
                  icon={Layers}
                  label="Blur"
                  description="Softens the background"
                >
                  <RangeSlider
                    value={effects.backgroundBlur}
                    min={0}
                    max={20}
                    step={1}
                    onChange={(v) => update("backgroundBlur", v)}
                    label={`${effects.backgroundBlur}px`}
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
                  Caption Placement
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
                    onChange={(v) =>
                      update(
                        "textPlacement",
                        v as VideoEffectsState["textPlacement"],
                      )
                    }
                  />
                </SettingRow>
              </div>
            </div>

            {/* ── Bottom reset ──────────────────────────────────────────── */}
            <div className="pt-2 pb-6">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setEffects(DEFAULT_EFFECTS)}
                className="w-full"
              >
                Reset to Defaults
              </Button>
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
    </div>
  );
}
