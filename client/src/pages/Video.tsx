import { useState } from "react";
import { motion } from "framer-motion";
import { Wand2, ArrowLeft, Sliders } from "lucide-react";
import { VideoCreator } from "../components/video/VideoCreator";

export function Video() {
  const [showSuccess, setShowSuccess] = useState(false);
  const [createdVideo, setCreatedVideo] = useState<any>(null);

  const handleCreate = (video: any) => {
    console.log("Video created:", video);
    setCreatedVideo(video);
    setShowSuccess(true);
    // Reset after 5 seconds
    setTimeout(() => {
      setShowSuccess(false);
      setCreatedVideo(null);
    }, 5000);
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#0a0a0a" }}>
      {/* Header */}
      <div
        className="sticky top-0 z-40 px-5 py-3 flex items-center justify-between"
        style={{
          backgroundColor: "#0a0a0a",
          borderBottom: "1px solid #262626",
        }}
      >
        <div className="flex items-center gap-3">
          <a
            href="/dashboard"
            className="text-[#505050] hover:text-[#E8E8E8] transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </a>
          <div className="flex items-center gap-2">
            <Wand2 className="w-5 h-5 text-[#10b981]" />
            <h1 className="text-lg font-semibold text-[#E8E8E8]">
              Create Video
            </h1>
          </div>
        </div>
        <a
          href="/video/effects"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors bg-[#141414] text-[#909090] hover:text-[#E8E8E8] hover:bg-[#202020] border border-[#202020]"
        >
          <Sliders className="w-3.5 h-3.5" />
          Effects
        </a>
      </div>

      {/* Main Content */}
      <div className="p-5 max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#141414] border border-[#1A1A1A] rounded-xl p-6"
        >
          <VideoCreator
            embedded={true}
            extended={true}
            onCreate={handleCreate}
          />
        </motion.div>
      </div>

      {/* Success Toast */}
      {showSuccess && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.9 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#10b981] text-zinc-950 px-6 py-4 rounded-xl font-bold shadow-2xl shadow-[#10b981]/30 border border-[#10b981]/50 min-w-[300px] text-center"
        >
          <div className="flex items-center justify-center gap-2">
            <span className="text-xl">🎉</span>
            <span>Video queued!</span>
          </div>
          <p className="text-xs text-zinc-800 mt-1 font-medium">
            "{createdVideo?.title}"
          </p>
        </motion.div>
      )}
    </div>
  );
}
