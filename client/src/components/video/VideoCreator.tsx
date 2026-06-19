import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  Check,
  Sparkles,
  X,
  Wand2,
  Download,
  Play,
} from "lucide-react";
import type { RedditCardConfig } from "../../templates/reddit";

interface VideoCreatorProps {
  onClose?: () => void;
  onCreate?: (video: any) => void;
  extended?: boolean;
  embedded?: boolean;
}

const templates = [
  {
    id: "pov",
    name: "POV in the life",
    description: "First-person perspective day-in-the-life content",
    icon: "👁️",
    titles: [
      "Swat Member",
      "Gang Member of Mexico",
      "Billionaire CEO",
      "Undercover Agent",
      "Pro Skateboarder",
    ],
  },
  {
    id: "storytime",
    name: "Storytime",
    description: "Personal stories and experiences that captivate",
    icon: "📖",
    titles: [
      "I Almost Drowned",
      "My Crazy Ex Story",
      "The Day I Got Fired",
      "I Met a Celebrity",
      "My Road Trip Disaster",
    ],
  },
  {
    id: "reddit",
    name: "Reddit Stories",
    description: "Compelling narratives from Reddit communities",
    icon: "📱",
    titles: [
      "AITA for Quitting?",
      "Crazy Karen Story",
      "Boss Freaked Out",
      "TIFU at Work",
      "Relationship Gone Wrong",
    ],
  },
  {
    id: "mystery",
    name: "Mystery",
    description: "Unsolved cases and mysterious phenomena",
    icon: "🔍",
    titles: [
      "Unsolved Disappearance",
      "The Lost Colony",
      "Zodiac Killer",
      "Bermuda Triangle",
      "DB Cooper",
    ],
  },
  {
    id: "facts",
    name: "Interesting Facts",
    description: "Mind-blowing facts and trivia",
    icon: "🧠",
    titles: [
      "Facts That Sound Fake",
      "Hidden iPhone Features",
      "Psychology Tricks",
      "Money Secrets",
      "Space Facts",
    ],
  },
  {
    id: "list",
    name: "Top 10",
    description: "Ranked lists and countdowns",
    icon: "📊",
    titles: [
      "Richest People",
      "Scary Videos",
      "Expensive Mistakes",
      "Amazing Inventions",
      "Creepiest Places",
    ],
  },
];

const channels = [
  "Tech Channel",
  "Vlog Life",
  "Gaming Hub",
  "Music Mix",
  "Cooking Daily",
];

const templateToFormat = (
  templateId: string | null,
): "pov_slideshow" | "reddit_story" => {
  if (templateId === "reddit") return "reddit_story";
  return "pov_slideshow";
};

export function VideoCreator({
  onClose,
  onCreate,
  extended = false,
  embedded = false,
}: VideoCreatorProps) {
  const [step, setStep] = useState(1);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [selectedChannel, setSelectedChannel] = useState<string>("all");
  const [customTitle, setCustomTitle] = useState("");
  const [selectedTitle, setSelectedTitle] = useState("");
  const [videoFormat, setVideoFormat] = useState<"full" | "short" | null>(
    "short",
  );
  const [confirmedScript, setConfirmedScript] = useState(false);
  const [confirmedImages, setConfirmedImages] = useState(false);
  const [isRegeneratingScript, setIsRegeneratingScript] = useState(false);
  const [isRegeneratingImages, setIsRegeneratingImages] = useState(false);
  const [durationRange, setDurationRange] = useState({ min: 30, max: 45 });
  const [showScriptPreview, setShowScriptPreview] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const [generatedScript, setGeneratedScript] = useState<any>(null);
  const [generationItems, setGenerationItems] = useState([
    { label: "Script", progress: 0, complete: false },
    { label: "Voiceover", progress: 0, complete: false },
    { label: "Editing", progress: 0, complete: false },
  ]);

  // Pipeline / preview state
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<string>("");
  const [jobError, setJobError] = useState<string>("");
  const [showPreview, setShowPreview] = useState(false);

  // Extended settings
  const [voiceStyle, setVoiceStyle] = useState("neutral");
  const [musicStyle] = useState("ambient");
  const [imageStyle] = useState("cinematic");
  const [subtitleStyle] = useState("minimal");
  const [pacing, setPacing] = useState("normal");
  const [aiModel] = useState("standard");

  const sliderRef = useRef<HTMLDivElement>(null);
  const [draggingThumb, setDraggingThumb] = useState<"min" | "max" | null>(
    null,
  );

  const isRedditStory = templateToFormat(selectedTemplate) === "reddit_story";

  // ── Step 4: generate real script ─────────────────────────────────────────
  useEffect(() => {
    if (step !== 4) return;
    let isCancelled = false;

    setGenerationItems((prev) => {
      if (isRedditStory && prev.some((i) => i.label === "Images")) {
        return prev.filter((i) => i.label !== "Images");
      }
      return prev;
    });

    const fetchScript = async () => {
      try {
        const titleToUse =
          selectedChannel === "all" ? selectedTitle : customTitle;
        const formatToUse = templateToFormat(selectedTemplate);
        const durationToUse =
          videoFormat === "short"
            ? "short-form (30-60 seconds)"
            : "full-length (8-12 minutes)";

        const response = await fetch("/api/video/generate-script", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            title: titleToUse,
            format: formatToUse,
            durationType: durationToUse,
            voiceStyle: extended ? voiceStyle : undefined,
            pacing: extended ? pacing : undefined,
            musicStyle: extended ? musicStyle : undefined,
            imageStyle: extended ? imageStyle : undefined,
            subtitleStyle: extended ? subtitleStyle : undefined,
            aiModel: extended ? aiModel : undefined,
          }),
        });
        const data = await response.json();
        if (!isCancelled && data.script) {
          setGeneratedScript(data.script);
        }
      } catch (err) {
        console.error("Failed to generate script:", err);
      }
    };

    if (!generatedScript || isRegeneratingScript) {
      fetchScript();
    }

    const interval = setInterval(() => {
      setGenerationItems((prev) => {
        const newItems = [...prev];
        for (let i = 0; i < newItems.length; i++) {
          if (!newItems[i].complete) {
            // Cap Script bar at 90% until generatedScript arrives
            if (
              newItems[i].label === "Script" &&
              !generatedScript &&
              newItems[i].progress >= 90
            )
              break;
            newItems[i].progress = Math.min(
              100,
              newItems[i].progress + Math.random() * 8,
            );
            if (newItems[i].progress >= 100) {
              newItems[i].progress = 100;
              newItems[i].complete = true;
            }
            break;
          }
        }
        return newItems;
      });
    }, 500);

    return () => {
      clearInterval(interval);
      isCancelled = true;
    };
  }, [step, isRegeneratingScript, generatedScript]);

  // Force Script bar to 100 when script arrives
  useEffect(() => {
    if (generatedScript && step === 4) {
      setGenerationItems((prev) =>
        prev.map((item) =>
          item.label === "Script"
            ? { ...item, progress: 100, complete: true }
            : item,
        ),
      );
    }
  }, [generatedScript, step]);

  // ── Step 7: poll job status ───────────────────────────────────────────────
  useEffect(() => {
    if (step !== 7 || !jobId) return;
    let isCancelled = false;

    const poll = async () => {
      try {
        const res = await fetch(`/api/video/queue/${jobId}`, {
          credentials: "include",
        });
        const data = await res.json();
        const job = data.job;
        if (!job || isCancelled) return;

        setJobStatus(job.status);

        if (job.status === "completed") {
          onCreate?.({
            id: jobId,
            title: selectedChannel === "all" ? selectedTitle : customTitle,
          });
          setShowPreview(true);
        } else if (job.status === "failed") {
          setJobError(job.error_message ?? "Pipeline failed");
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    };

    poll();
    const interval = setInterval(poll, 2500);
    return () => {
      clearInterval(interval);
      isCancelled = true;
    };
  }, [step, jobId]);

  // ── Sync generation bars with real job status ────────────────────────────
  useEffect(() => {
    if (!jobStatus) return;

    if (jobStatus === "completed") {
      setGenerationItems((prev) =>
        prev.map((item) => ({ ...item, progress: 100, complete: true })),
      );
    } else if (jobStatus === "compositing") {
      setGenerationItems((prev) =>
        prev.map((item) => {
          if (item.label === "Script" || item.label === "Voiceover")
            return { ...item, progress: 100, complete: true };
          if (item.label === "Editing")
            return { ...item, progress: Math.max(item.progress, 75) };
          return item;
        }),
      );
    } else if (jobStatus === "generating_voice") {
      setGenerationItems((prev) =>
        prev.map((item) => {
          if (item.label === "Script")
            return { ...item, progress: 100, complete: true };
          if (item.label === "Voiceover")
            return { ...item, progress: Math.max(item.progress, 60) };
          return item;
        }),
      );
    } else if (jobStatus === "generating") {
      setGenerationItems((prev) =>
        prev.map((item) => {
          if (item.label === "Script")
            return { ...item, progress: 100, complete: true };
          return item;
        }),
      );
    } else if (jobStatus === "failed") {
      // Keep bars as-is so user can see where it stopped
    }
  }, [jobStatus]);

  // ── Slider drag ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!draggingThumb || !sliderRef.current) return;
    const absoluteMin = videoFormat === "short" ? 30 : 5;
    const absoluteMax = videoFormat === "short" ? 60 : 20;
    const stepRange = videoFormat === "short" ? 5 : 1;
    const gap = stepRange;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = sliderRef.current!.getBoundingClientRect();
      const pct = Math.max(
        0,
        Math.min(100, ((e.clientX - rect.left) / rect.width) * 100),
      );
      const raw = absoluteMin + (pct / 100) * (absoluteMax - absoluteMin);
      const val = Math.max(
        absoluteMin,
        Math.min(absoluteMax, Math.round(raw / stepRange) * stepRange),
      );
      if (draggingThumb === "min") {
        setDurationRange((prev) => ({
          ...prev,
          min: Math.min(val, prev.max - gap),
        }));
      } else {
        setDurationRange((prev) => ({
          ...prev,
          max: Math.max(val, prev.min + gap),
        }));
      }
    };
    const handleMouseUp = () => setDraggingThumb(null);
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [draggingThumb, videoFormat]);

  const currentTemplate = templates.find((t) => t.id === selectedTemplate);

  const canProceed = () => {
    switch (step) {
      case 1:
        return selectedTemplate !== null;
      case 2:
        return (
          selectedChannel !== "" &&
          (selectedChannel !== "all"
            ? customTitle.trim() !== ""
            : selectedTitle !== "")
        );
      case 3:
        return videoFormat !== null;
      case 4:
        return (
          generationItems.every((item) => item.complete) &&
          generatedScript !== null
        );
      case 5:
        return confirmedScript && (isRedditStory || confirmedImages);
      default:
        return true;
    }
  };

  // ── Build Reddit card config from generated script ────────────────────────
  const buildRedditConfig = (): RedditCardConfig => {
    const TIMEAGOS = ["2 hours ago", "4 hours ago", "6 hours ago", "1 day ago"];
    return {
      username: "throwaway_8472",
      subreddit: generatedScript?.subreddit?.replace(/^r\//, "") ?? "AskReddit",
      postTitle: generatedScript?.title ?? selectedTitle ?? customTitle,
      postBody: generatedScript?.hook ?? "",
      upvotes: Math.floor(Math.random() * 80000) + 5000,
      comments: Math.floor(Math.random() * 11500) + 500,
      timeAgo: TIMEAGOS[Math.floor(Math.random() * TIMEAGOS.length)],
      theme: "dark",
      showVerified: false,
      showAwards: true,
      avatarSrc: "",
      upvoteState: "none",
    };
  };

  const [redditConfig, setRedditConfig] = useState<RedditCardConfig | null>(
    null,
  );

  useEffect(() => {
    if (generatedScript) {
      setRedditConfig(buildRedditConfig());
    } else {
      setRedditConfig(null);
    }
  }, [generatedScript]);

  // ── Render step content ───────────────────────────────────────────────────
  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            <p className="text-sm text-[#909090]">Choose a content template</p>
            <div className="grid grid-cols-2 gap-3 max-h-[320px] overflow-y-auto pr-1">
              {templates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => {
                    setSelectedTemplate(template.id);
                    setSelectedTitle("");
                  }}
                  className={`p-4 rounded-lg border text-left transition-all ${selectedTemplate === template.id ? "border-[#10b981] bg-[#10b981]/10" : "border-[#1A1A1A] hover:border-[#262626]"}`}
                >
                  <div className="text-2xl mb-2">{template.icon}</div>
                  <div className="text-sm font-medium text-[#E8E8E8] mb-1">
                    {template.name}
                  </div>
                  <div className="text-xs text-[#505050] leading-relaxed">
                    {template.description}
                  </div>
                </button>
              ))}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <p className="text-sm text-[#909090]">Select channel and title</p>
            <div className="relative">
              <button
                onClick={() =>
                  setSelectedChannel(selectedChannel === "" ? "all" : "")
                }
                className="w-full flex items-center justify-between p-3 rounded-lg bg-[#1A1A1A] text-[#E8E8E8] text-sm"
              >
                <span>
                  {selectedChannel === "all"
                    ? "All Channels"
                    : selectedChannel || "Select a channel"}
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-[#505050] transition-transform ${selectedChannel === "" ? "rotate-180" : ""}`}
                />
              </button>
              <AnimatePresence>
                {selectedChannel === "" && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-full left-0 right-0 mt-1 bg-[#1A1A1A] rounded-lg border border-[#262626] overflow-hidden z-10"
                  >
                    <button
                      onClick={() => setSelectedChannel("all")}
                      className="w-full px-3 py-2 text-left text-sm text-[#E8E8E8] hover:bg-[#262626] transition-colors"
                    >
                      All Channels
                    </button>
                    {channels.map((channel) => (
                      <button
                        key={channel}
                        onClick={() => {
                          setSelectedChannel(channel);
                          setSelectedTitle("");
                          setCustomTitle("");
                        }}
                        className="w-full px-3 py-2 text-left text-sm text-[#E8E8E8] hover:bg-[#262626] transition-colors"
                      >
                        {channel}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            {selectedChannel === "all" ? (
              <div className="space-y-3">
                <p className="text-xs text-[#505050]">
                  Select from AI-generated titles:
                </p>
                <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                  {currentTemplate?.titles.map((title, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedTitle(title)}
                      className={`w-full p-3 rounded-lg text-left text-sm transition-all ${selectedTitle === title ? "bg-[#10b981]/10 border border-[#10b981] text-[#E8E8E8]" : "bg-[#1A1A1A] text-[#909090] hover:text-[#E8E8E8]"}`}
                    >
                      {title}
                    </button>
                  ))}
                </div>
              </div>
            ) : selectedChannel ? (
              <div className="space-y-4">
                <p className="text-sm text-[#909090]">
                  Enter your video title for {selectedChannel}
                </p>
                <input
                  type="text"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder={`e.g., ${currentTemplate?.titles[0]}...`}
                  className="w-full px-3 py-3 rounded-lg bg-[#1A1A1A] border border-[#1A1A1A] text-[#E8E8E8] text-sm placeholder:text-[#505050] focus:border-[#10b981] outline-none"
                />
                <div className="text-xs text-[#505050]">
                  Template:{" "}
                  <span className="text-[#909090]">
                    {currentTemplate?.name}
                  </span>
                </div>
              </div>
            ) : null}
          </div>
        );

      case 3: {
        const absoluteMin = videoFormat === "short" ? 30 : 5;
        const absoluteMax = videoFormat === "short" ? 60 : 20;
        const unit = videoFormat === "short" ? "sec" : "min";
        const valueToPercent = (val: number) =>
          ((val - absoluteMin) / (absoluteMax - absoluteMin)) * 100;
        const handleMinChange = (val: number) => {
          const gap = videoFormat === "short" ? 5 : 1;
          setDurationRange((prev) => ({
            ...prev,
            min: Math.max(absoluteMin, Math.min(val, prev.max - gap)),
          }));
        };
        const handleMaxChange = (val: number) => {
          const gap = videoFormat === "short" ? 5 : 1;
          setDurationRange((prev) => ({
            ...prev,
            max: Math.min(absoluteMax, Math.max(val, prev.min + gap)),
          }));
        };

        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-[#909090]">Choose your video format</p>
              <span className="text-xs text-[#10b981] font-semibold bg-[#10b981]/10 px-2 py-0.5 rounded">
                Shorts-only Mode
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 rounded-lg border border-[#1A1A1A] text-center bg-zinc-900/40 opacity-40 cursor-not-allowed relative overflow-hidden">
                <span className="absolute top-2 right-2 text-[9px] uppercase tracking-wider bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded font-bold">
                  Locked
                </span>
                <div className="text-lg mb-1">🎬</div>
                <div className="text-sm font-medium text-zinc-500">
                  Full Length
                </div>
                <div className="text-xs text-zinc-600 mt-1">
                  Shorts only until next update
                </div>
              </div>
              <button
                onClick={() => {
                  setVideoFormat("short");
                  setDurationRange({ min: 30, max: 45 });
                }}
                className={`p-4 rounded-lg border text-center transition-all ${videoFormat === "short" ? "border-[#10b981] bg-[#10b981]/10" : "border-[#1A1A1A] hover:border-[#262626]"}`}
              >
                <div className="text-lg mb-1">⚡</div>
                <div className="text-sm font-medium text-[#E8E8E8]">
                  YouTube Short
                </div>
                <div className="text-xs text-[#505050] mt-1">30-60 sec</div>
              </button>
            </div>

            {videoFormat && (
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-center gap-3">
                  <div className="flex items-center gap-2 bg-[#1A1A1A] rounded-lg px-3 py-2">
                    <span className="text-xs text-[#505050]">Min</span>
                    <input
                      type="number"
                      value={durationRange.min}
                      min={absoluteMin}
                      max={durationRange.max - 1}
                      onChange={(e) =>
                        handleMinChange(parseInt(e.target.value))
                      }
                      className="w-12 bg-transparent text-sm text-[#E8E8E8] text-center outline-none appearance-none [-moz-appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <span className="text-xs text-[#505050]">{unit}</span>
                  </div>
                  <span className="text-[#505050]">-</span>
                  <div className="flex items-center gap-2 bg-[#1A1A1A] rounded-lg px-3 py-2">
                    <span className="text-xs text-[#505050]">Max</span>
                    <input
                      type="number"
                      value={durationRange.max}
                      min={durationRange.min + 1}
                      max={absoluteMax}
                      onChange={(e) =>
                        handleMaxChange(parseInt(e.target.value))
                      }
                      className="w-12 bg-transparent text-sm text-[#E8E8E8] text-center outline-none appearance-none [-moz-appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <span className="text-xs text-[#505050]">{unit}</span>
                  </div>
                </div>

                <div ref={sliderRef} className="relative h-10 select-none mt-2">
                  <div className="absolute top-1/2 left-0 right-0 h-2 bg-[#1A1A1A] rounded-full -translate-y-1/2" />
                  <div
                    className="absolute top-1/2 h-2 bg-[#E8E8E8] rounded-full -translate-y-1/2 pointer-events-none"
                    style={{
                      left: `${valueToPercent(durationRange.min)}%`,
                      width: `${valueToPercent(durationRange.max) - valueToPercent(durationRange.min)}%`,
                    }}
                  />
                  <div
                    className={`absolute top-1/2 w-5 h-5 bg-[#E8E8E8] rounded-full -translate-y-1/2 -translate-x-1/2 cursor-grab shadow-lg z-10 ${draggingThumb === "min" ? "cursor-grabbing scale-110" : "hover:scale-110"}`}
                    style={{ left: `${valueToPercent(durationRange.min)}%` }}
                    onMouseDown={() => setDraggingThumb("min")}
                  />
                  <div
                    className={`absolute top-1/2 w-5 h-5 bg-[#E8E8E8] rounded-full -translate-y-1/2 -translate-x-1/2 cursor-grab shadow-lg ${draggingThumb === "max" ? "cursor-grabbing scale-110" : "hover:scale-110"}`}
                    style={{ left: `${valueToPercent(durationRange.max)}%` }}
                    onMouseDown={() => setDraggingThumb("max")}
                  />
                </div>

                <div className="flex justify-between text-[10px] text-[#505050] px-2">
                  <span>
                    {absoluteMin} {unit}
                  </span>
                  <span>
                    {absoluteMax} {unit}
                  </span>
                </div>

                {extended && (
                  <div className="space-y-4 pt-4 border-t border-[#262626]">
                    <p className="text-sm text-[#909090]">Advanced Settings</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <label className="text-xs text-[#505050]">
                          Voice Style
                        </label>
                        <select
                          value={voiceStyle}
                          onChange={(e) => setVoiceStyle(e.target.value)}
                          className="w-full p-2 rounded-lg bg-[#1A1A1A] border border-[#262626] text-[#E8E8E8] text-sm outline-none focus:border-[#10b981]"
                        >
                          <option value="neutral">Neutral</option>
                          <option value="energetic">Energetic</option>
                          <option value="calm">Calm</option>
                          <option value="dramatic">Dramatic</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs text-[#505050]">Pacing</label>
                        <select
                          value={pacing}
                          onChange={(e) => setPacing(e.target.value)}
                          className="w-full p-2 rounded-lg bg-[#1A1A1A] border border-[#262626] text-[#E8E8E8] text-sm outline-none focus:border-[#10b981]"
                        >
                          <option value="slow">Slow</option>
                          <option value="normal">Normal</option>
                          <option value="fast">Fast</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      }

      case 4:
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Sparkles className="w-4 h-4 text-[#E8E8E8]" />
              </motion.div>
              <span className="text-sm text-[#E8E8E8]">
                AI Generation Pipeline
              </span>
            </div>
            <p className="text-sm text-[#909090]">
              Generating content for:{" "}
              <span className="text-[#E8E8E8]">
                {selectedChannel === "all" ? selectedTitle : customTitle}
              </span>
            </p>
            <div className="space-y-3">
              {generationItems.map((item) => (
                <div key={item.label}>
                  <div className="flex items-center gap-3">
                    <div className="w-20 text-xs text-[#505050]">
                      {item.label}
                    </div>
                    <div className="flex-1 h-1.5 bg-[#1A1A1A] rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-[#E8E8E8]"
                        initial={{ width: 0 }}
                        animate={{ width: `${item.progress}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                    <div
                      className={`text-xs ${item.complete ? "text-emerald-500" : "text-[#505050]"}`}
                    >
                      {item.complete ? (
                        <Check className="w-3 h-3" />
                      ) : (
                        `${Math.round(item.progress)}%`
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-4">
            <div className="p-4 bg-[#1A1A1A] rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#E8E8E8]">Review Script</span>
                <span className="text-xs text-emerald-500">AI Generated</span>
              </div>
              <p className="text-xs text-[#909090] leading-relaxed">
                Script generated with {generatedScript?.sections?.length ?? 0}{" "}
                beats. Review it before generating the video.
              </p>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={confirmedScript}
                    onChange={(e) => setConfirmedScript(e.target.checked)}
                    className="rounded border-[#1A1A1A] bg-[#141414] text-[#10b981]"
                  />
                  <span className="text-sm">Confirm Script</span>
                </label>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowScriptPreview(true)}
                  className="text-xs text-[#909090] hover:text-[#E8E8E8] underline underline-offset-2 transition-colors"
                >
                  View script
                </button>
                <span className="text-[#505050]">|</span>
                <button
                  onClick={() => {
                    setIsRegeneratingScript(true);
                    setConfirmedScript(false);
                    setGeneratedScript(null);
                    setGenerationItems([
                      { label: "Script", progress: 0, complete: false },
                      { label: "Voiceover", progress: 0, complete: false },
                      { label: "Editing", progress: 0, complete: false },
                    ]);
                    setStep(4);
                    setTimeout(() => setIsRegeneratingScript(false), 100);
                  }}
                  className="text-xs text-[#10b981] hover:text-[#10b981]/80 underline underline-offset-2 transition-colors"
                >
                  Regenerate
                </button>
              </div>
            </div>

            {!isRedditStory && (
              <div className="p-4 bg-[#1A1A1A] rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#E8E8E8]">Review Images</span>
                  <span className="text-xs text-emerald-500">AI Generated</span>
                </div>
                <p className="text-xs text-[#909090] leading-relaxed">
                  Images generated for each section of your script.
                </p>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={confirmedImages}
                      onChange={(e) => setConfirmedImages(e.target.checked)}
                      className="rounded border-[#1A1A1A] bg-[#141414] text-[#10b981]"
                    />
                    <span className="text-sm">Confirm Images</span>
                  </label>
                </div>
                <button
                  onClick={() => {
                    setIsRegeneratingImages(true);
                    setConfirmedImages(false);
                    setTimeout(() => {
                      setIsRegeneratingImages(false);
                    }, 2000);
                  }}
                  disabled={isRegeneratingImages}
                  className="text-xs text-[#10b981] hover:text-[#10b981]/80 underline underline-offset-2 transition-colors disabled:opacity-50"
                >
                  {isRegeneratingImages
                    ? "Regenerating..."
                    : "Regenerate images"}
                </button>
              </div>
            )}
          </div>
        );

      case 6:
        return (
          <div className="space-y-4 text-center">
            <div className="w-16 h-16 rounded-full bg-[#10b981]/20 flex items-center justify-center mx-auto">
              <Check className="w-8 h-8 text-[#10b981]" />
            </div>
            <h4 className="text-lg font-semibold text-[#E8E8E8]">
              Ready to Build!
            </h4>
            <div className="text-sm text-[#909090] space-y-1 text-left bg-[#1A1A1A] rounded-lg p-4">
              <p>
                Template:{" "}
                <span className="text-[#E8E8E8]">{currentTemplate?.name}</span>
              </p>
              <p>
                Title:{" "}
                <span className="text-[#E8E8E8]">
                  {selectedChannel === "all" ? selectedTitle : customTitle}
                </span>
              </p>
              <p>
                Format:{" "}
                <span className="text-[#E8E8E8]">
                  {videoFormat === "short" ? "YouTube Short" : "Full Length"}
                </span>
              </p>
              {isRedditStory && (
                <p>
                  Pipeline:{" "}
                  <span className="text-emerald-400">
                    Script → Polly TTS → FFmpeg → Preview
                  </span>
                </p>
              )}
            </div>
            {submitError && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-xs text-left">
                {submitError}
              </div>
            )}
          </div>
        );

      case 7:
        return (
          <div className="space-y-5">
            <div className="flex items-center gap-2">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Sparkles className="w-4 h-4 text-[#E8E8E8]" />
              </motion.div>
              <span className="text-sm text-[#E8E8E8] font-medium">
                Building your video…
              </span>
            </div>

            <div className="space-y-3">
              {[
                { key: "generating", label: "Script ready", done: true },
                {
                  key: "generating_voice",
                  label: "Generating voiceover (AWS Polly)",
                  done: [
                    "generating_voice",
                    "compositing",
                    "completed",
                  ].includes(jobStatus),
                },
                {
                  key: "compositing",
                  label: "Compositing with FFmpeg (1080×1920)",
                  done: ["compositing", "completed"].includes(jobStatus),
                },
                {
                  key: "completed",
                  label: "Video ready!",
                  done: jobStatus === "completed",
                },
              ].map(({ key, label, done }) => (
                <div key={key} className="flex items-center gap-3">
                  <div
                    className={`w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 transition-all ${done ? "border-emerald-500 bg-emerald-500/20" : "border-[#505050]"}`}
                  >
                    {done && <Check className="w-3 h-3 text-emerald-500" />}
                  </div>
                  <span
                    className={`text-sm ${done ? "text-[#E8E8E8]" : "text-[#505050]"}`}
                  >
                    {label}
                  </span>
                  {!done && key !== "completed" && (
                    <div className="flex gap-0.5 ml-auto">
                      {[0, 1, 2].map((i) => (
                        <motion.div
                          key={i}
                          className="w-1 h-1 rounded-full bg-[#505050]"
                          animate={{ opacity: [0.3, 1, 0.3] }}
                          transition={{
                            duration: 1.2,
                            delay: i * 0.2,
                            repeat: Infinity,
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {jobStatus === "failed" && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-xs">
                {jobError || "Pipeline failed. Check server logs."}
              </div>
            )}

            {jobStatus === "completed" && (
              <button
                onClick={() => setShowPreview(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-[#10b981] text-zinc-950 text-sm font-bold hover:bg-[#10b981]/90 transition-colors"
              >
                <Play className="w-4 h-4" /> Watch Preview
              </button>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  // ── Launch pipeline ───────────────────────────────────────────────────────
  const handleGenerate = async () => {
    const title = selectedChannel === "all" ? selectedTitle : customTitle;
    const format = templateToFormat(selectedTemplate);
    const durationType =
      videoFormat === "short"
        ? "short-form (30-60 seconds)"
        : "full-length (8-12 minutes)";
    setIsSubmitting(true);
    setSubmitError("");
    try {
      const response = await fetch("/api/video/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title,
          format,
          durationType,
          voiceStyle: extended ? voiceStyle : undefined,
          pacing: extended ? pacing : undefined,
          script: generatedScript,
          redditConfig: redditConfig || undefined,
        }),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Failed to start pipeline");
      setJobId(data.jobId);
      setJobStatus("generating");
      setStep(7);
    } catch (err: any) {
      setSubmitError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Reset wizard ─────────────────────────────────────────────────────────
  const resetWizard = () => {
    setStep(1);
    setSelectedTemplate(null);
    setSelectedChannel("all");
    setCustomTitle("");
    setSelectedTitle("");
    setVideoFormat("short");
    setConfirmedScript(false);
    setConfirmedImages(false);
    setDurationRange({ min: 30, max: 45 });
    setGeneratedScript(null);
    setJobId(null);
    setJobStatus("");
    setJobError("");
    setGenerationItems([
      { label: "Script", progress: 0, complete: false },
      { label: "Voiceover", progress: 0, complete: false },
      { label: "Editing", progress: 0, complete: false },
    ]);
  };

  const content = (
    <>
      {!embedded && (
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-[#E8E8E8]">Create Video</h3>
          {onClose && (
            <button
              onClick={onClose}
              className="text-[#505050] hover:text-[#E8E8E8] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      )}

      {embedded && (
        <div className="flex items-center gap-2 mb-6">
          <Wand2 className="w-5 h-5 text-[#10b981]" />
          <h3 className="text-lg font-semibold text-[#E8E8E8]">
            Create New Video
          </h3>
        </div>
      )}

      {!embedded && step < 7 && (
        <div className="flex items-center gap-2 mb-6">
          {[1, 2, 3, 4, 5, 6].map((s) => (
            <div
              key={s}
              className={`flex-1 h-1 rounded-full transition-colors ${s <= step ? "bg-[#10b981]" : "bg-[#1A1A1A]"}`}
            />
          ))}
        </div>
      )}

      {renderStep()}

      {step < 6 && (
        <div className="flex items-center gap-3 mt-6">
          {step > 1 && (
            <button
              onClick={() => setStep(step - 1)}
              className="flex-1 px-4 py-2.5 rounded-lg bg-[#1A1A1A] text-[#E8E8E8] text-sm font-medium hover:bg-[#262626] transition-colors"
            >
              Back
            </button>
          )}
          <button
            onClick={() => setStep(step + 1)}
            disabled={!canProceed()}
            className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${canProceed() ? "bg-[#10b981] text-zinc-950 hover:bg-[#10b981]/90" : "bg-[#1A1A1A] text-[#505050] cursor-not-allowed"}`}
          >
            {step === 5 ? "Review" : "Next"}
          </button>
        </div>
      )}

      {step === 6 && (
        <div className="mt-6 flex gap-3">
          <button
            onClick={() => setStep(5)}
            className="px-4 py-2.5 rounded-lg bg-[#1A1A1A] text-[#E8E8E8] text-sm font-medium hover:bg-[#262626] transition-colors"
          >
            Back
          </button>
          <button
            disabled={isSubmitting}
            onClick={handleGenerate}
            className="flex-1 px-4 py-3 rounded-lg bg-[#10b981] text-zinc-950 text-sm font-bold hover:bg-[#10b981]/90 transition-colors shadow-lg shadow-[#10b981]/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />{" "}
                Starting...
              </>
            ) : (
              "🎬 Generate Video Now"
            )}
          </button>
        </div>
      )}

      {step === 7 && (jobStatus === "failed" || jobStatus === "completed") && (
        <div className="mt-6">
          <button
            onClick={resetWizard}
            className="w-full px-4 py-2.5 rounded-lg bg-[#1A1A1A] text-[#E8E8E8] text-sm font-medium hover:bg-[#262626] transition-colors"
          >
            Create Another Video
          </button>
        </div>
      )}
    </>
  );

  // ── Script preview modal ─────────────────────────────────────────────────
  const scriptPreviewModal = (
    <AnimatePresence>
      {showScriptPreview && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => setShowScriptPreview(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-[#141414] border border-[#1A1A1A] rounded-xl p-6 w-full max-w-lg max-h-[70vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-[#E8E8E8]">
                Generated Script
              </h4>
              <button
                onClick={() => setShowScriptPreview(false)}
                className="text-[#505050] hover:text-[#E8E8E8] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4 text-sm text-[#909090] leading-relaxed">
              {generatedScript ? (
                <>
                  <div className="text-left">
                    <p className="text-[#E8E8E8] font-semibold mb-1">
                      {generatedScript.title}
                    </p>
                    {generatedScript.subreddit && (
                      <p className="text-[#10b981] text-xs">
                        {generatedScript.subreddit}
                      </p>
                    )}
                  </div>
                  <div className="text-left">
                    <p className="text-[#E8E8E8] font-medium mb-1 uppercase text-xs tracking-wide">
                      Hook
                    </p>
                    <p>{generatedScript.hook}</p>
                  </div>
                  <div className="text-left space-y-3">
                    <p className="text-[#E8E8E8] font-medium uppercase text-xs tracking-wide">
                      Story ({generatedScript.sections?.length ?? 0} beats)
                    </p>
                    {generatedScript.sections?.map(
                      (section: any, idx: number) => (
                        <div
                          key={idx}
                          className="pl-3 border-l-2 border-[#262626]"
                        >
                          <p className="text-[#E8E8E8] text-xs font-semibold uppercase tracking-wide">
                            {section.label}
                          </p>
                          <p className="mt-1">{section.narration}</p>
                        </div>
                      ),
                    )}
                  </div>
                  <div className="text-left">
                    <p className="text-[#E8E8E8] font-medium mb-1 uppercase text-xs tracking-wide">
                      Outro
                    </p>
                    <p>{generatedScript.outro}</p>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <div className="w-6 h-6 border-2 border-[#10b981] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  <p>Generating your script…</p>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  // ── Video preview modal ──────────────────────────────────────────────────
  const videoPreviewModal = (
    <AnimatePresence>
      {showPreview && jobId && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
          onClick={() => setShowPreview(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative flex flex-col items-center gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between w-full max-w-xs">
              <h4 className="text-lg font-semibold text-white">Preview</h4>
              <button
                onClick={() => setShowPreview(false)}
                className="text-white/60 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 9:16 video container with Reddit card overlay */}
            <div
              className="relative bg-black rounded-2xl overflow-hidden shadow-2xl"
              style={{ width: 270, height: 480 }}
            >
              <video
                src={`/api/video/preview/${jobId}`}
                controls
                autoPlay
                playsInline
                className="absolute inset-0 w-full h-full object-cover"
              />
            </div>

            <a
              href={`/api/video/preview/${jobId}`}
              download={`reddit-story-${jobId}.mp4`}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#10b981] text-zinc-950 text-sm font-bold hover:bg-[#10b981]/90 transition-colors"
            >
              <Download className="w-4 h-4" /> Download MP4
            </a>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  if (embedded) {
    return (
      <>
        <div className="space-y-4">{content}</div>
        {scriptPreviewModal}
        {videoPreviewModal}
      </>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-[#141414] border border-[#1A1A1A] rounded-xl p-6 w-full max-w-lg max-h-[85vh] overflow-y-auto"
      >
        {content}
      </motion.div>
      {scriptPreviewModal}
      {videoPreviewModal}
    </div>
  );
}
