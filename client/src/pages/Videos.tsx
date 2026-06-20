import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Search,
  Play,
  Edit2,
  Trash2,
  Calendar,
  Download,
  Upload,
  Youtube,
  X,
  AlertCircle,
  Tag,
  CheckSquare,
  Square,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cachedFetch, invalidateCache } from "@/lib/cache";

interface VideoJob {
  id: string;
  title: string;
  format: string;
  status:
    | "generating"
    | "generating_voice"
    | "compositing"
    | "completed"
    | "failed";
  r2_url: string | null;
  thumbnail_url: string | null;
  yt_video_id: string | null;
  yt_video_url: string | null;
  tags: string[] | null;
  created_at: string;
  scheduled_at: string | null;
  error_message: string | null;
}

const statusColors: Record<string, string> = {
  completed: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  generating: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  generating_voice: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
  compositing: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  failed: "bg-rose-500/20 text-rose-400 border-rose-500/30",
};

const statusLabels: Record<string, string> = {
  completed: "Completed",
  generating: "Scripting",
  generating_voice: "Voiceover",
  compositing: "Compositing",
  failed: "Failed",
};

export function Videos() {
  const navigate = useNavigate();
  const [videos, setVideos] = useState<VideoJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtering and Searching
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Interactive Modal States
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);
  const [playingVideoTitle, setPlayingVideoIdTitle] = useState<string>("");
  const [editingVideo, setEditingVideo] = useState<VideoJob | null>(null);
  const [editTitleValue, setEditTitleValue] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    id: string;
    title: string;
    batch?: boolean;
  } | null>(null);

  // Selection & Tagging State
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [activeTagFilter, setActiveTagFilter] = useState<string | null>(null);
  const [showTagModal, setShowTagModal] = useState(false);
  const [showTagManager, setShowTagManager] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [isTagSaving, setIsTagSaving] = useState(false);
  const [isDeletingSelected, setIsDeletingSelected] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [publishTargets, setPublishTargets] = useState<any[]>([]);
  const [publishingIds, setPublishingIds] = useState<Set<string>>(new Set());
  const [selectedPublishIds, setSelectedPublishIds] = useState<Set<string>>(
    new Set(),
  );

  // Fetch videos from video queue on mount
  const fetchVideos = async () => {
    try {
      setIsLoading(true);
      const data = await cachedFetch("/api/video/queue", { ttl: 10000 });
      setVideos(data.jobs || []);
      setError(null);
    } catch (err: any) {
      console.error("Error fetching videos:", err);
      setError(err.message || "An error occurred while loading videos.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, []);

  // Trigger brief visual toasts
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const handleDeleteClick = (id: string, title: string) => {
    setDeleteConfirm({ id, title });
  };

  const executeDelete = async () => {
    if (!deleteConfirm) return;
    const { id } = deleteConfirm;
    setDeleteConfirm(null);

    try {
      const res = await fetch(`/api/video/queue/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        throw new Error("Failed to delete video");
      }
      invalidateCache("/api/video/queue");
      setVideos((prev) => prev.filter((v) => v.id !== id));
      showToast("Video deleted successfully!");
    } catch (err: any) {
      console.error("Delete error:", err);
      alert(err.message || "Error deleting video.");
    }
  };

  // Handle Video Edit/Rename
  const handleSaveEdit = async () => {
    if (!editingVideo) return;
    if (!editTitleValue.trim()) {
      alert("Title cannot be blank.");
      return;
    }

    try {
      setIsSavingEdit(true);
      const res = await fetch(`/api/video/queue/${editingVideo.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: editTitleValue }),
        credentials: "include",
      });
      if (!res.ok) {
        throw new Error("Failed to update title");
      }
      const data = await res.json();

      // Update UI list
      setVideos((prev) =>
        prev.map((v) =>
          v.id === editingVideo.id ? { ...v, title: data.job.title } : v,
        ),
      );
      setEditingVideo(null);
      showToast("Title updated successfully!");
    } catch (err: any) {
      console.error("Update error:", err);
      alert(err.message || "Error updating video.");
    } finally {
      setIsSavingEdit(false);
    }
  };

  // ── Batch operations ──────────────────────────────────────────────────
  const handleBatchDeleteClick = () => {
    if (selectedIds.size === 0) return;
    const count = selectedIds.size;
    setDeleteConfirm({
      id: [...selectedIds].join(","),
      title: `${count} selected video${count > 1 ? "s" : ""}`,
      batch: true,
    });
  };

  const executeBatchDelete = async () => {
    setIsDeletingSelected(true);
    try {
      await Promise.all(
        [...selectedIds].map((id) =>
          fetch(`/api/video/queue/${id}`, {
            method: "DELETE",
            credentials: "include",
          }),
        ),
      );
      invalidateCache("/api/video/queue");
      setVideos((prev) => prev.filter((v) => !selectedIds.has(v.id)));
      showToast(
        selectedIds.size === 1
          ? "Video deleted successfully!"
          : `${selectedIds.size} videos deleted successfully!`,
      );
      setSelectedIds(new Set());
    } catch (err: any) {
      console.error("Batch delete error:", err);
      alert("Error deleting videos.");
    } finally {
      setIsDeletingSelected(false);
    }
  };

  const handleTagUpdate = async (
    action: "add" | "remove" | "set",
    tags: string[],
  ) => {
    if (selectedIds.size === 0 || tags.length === 0) return;
    setIsTagSaving(true);
    try {
      const res = await fetch("/api/video/tags", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [...selectedIds], tags, action }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update tags");

      // Update local state
      setVideos((prev) =>
        prev.map((v) => {
          if (!selectedIds.has(v.id)) return v;
          const currentTags = v.tags || [];
          let newTags: string[];
          switch (action) {
            case "add":
              newTags = [...new Set([...currentTags, ...tags])];
              break;
            case "remove":
              newTags = currentTags.filter((t) => !tags.includes(t));
              break;
            case "set":
              newTags = tags;
              break;
            default:
              newTags = currentTags;
          }
          return { ...v, tags: newTags };
        }),
      );

      showToast(
        action === "add"
          ? "Tags added!"
          : action === "remove"
            ? "Tags removed!"
            : "Tags updated!",
      );
    } catch (err: any) {
      console.error("Tag update error:", err);
      alert("Error updating tags.");
    } finally {
      setIsTagSaving(false);
      setShowTagModal(false);
    }
  };

  // Toggle a video's selection state
  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Add a tag to ALL videos (global add)
  const handleGlobalAddTag = async (tag: string) => {
    if (!tag.trim()) return;
    const allIds = videos.map((v) => v.id);
    if (allIds.length === 0) return;

    setIsTagSaving(true);
    try {
      const res = await fetch("/api/video/tags", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ids: allIds,
          tags: [tag.trim()],
          action: "add",
        }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to add tag");

      setVideos((prev) =>
        prev.map((v) => ({
          ...v,
          tags: [...new Set([...(v.tags || []), tag.trim()])],
        })),
      );
      showToast(`Tag "${tag}" added to all videos.`);
    } catch (err: any) {
      console.error("Global tag add error:", err);
      alert("Failed to add tag.");
    } finally {
      setIsTagSaving(false);
    }
  };

  // Delete a tag from ALL videos (global tag removal)
  const handleDeleteTag = async (tag: string) => {
    if (!confirm(`Delete tag "${tag}" from all videos?`)) return;

    try {
      const res = await fetch(`/api/video/tags/${encodeURIComponent(tag)}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete tag");

      // Update local state
      setVideos((prev) =>
        prev.map((v) => ({
          ...v,
          tags: v.tags ? v.tags.filter((t) => t !== tag) : null,
        })),
      );
      if (activeTagFilter === tag) setActiveTagFilter(null);
      showToast(`Tag "${tag}" deleted.`);
    } catch (err: any) {
      console.error("Tag delete error:", err);
      alert("Failed to delete tag.");
    }
  };

  // ── Publish to YouTube ──────────────────────────────────────────────
  const loadPublishTargets = async () => {
    try {
      const res = await fetch("/api/youtube/accounts", {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch YouTube accounts");
      const data = await res.json();
      setPublishTargets(data.accounts || []);
      setShowPublishModal(true);
    } catch (err: any) {
      console.error("Failed to load publish targets:", err);
      alert("No YouTube accounts connected. Go to Accounts to link one.");
    }
  };

  const handlePublish = async (accountId: string) => {
    const ids = [...selectedPublishIds];
    setPublishingIds(new Set(ids));

    for (const jobId of ids) {
      try {
        const res = await fetch("/api/youtube/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ jobId, accountId }),
          credentials: "include",
        });
        const data = await res.json();
        if (!res.ok) {
          console.error(`[Publish] Failed for ${jobId}:`, data.error);
          continue;
        }
        // Update the local video record with yt_video_id
        setVideos((prev) =>
          prev.map((v) =>
            v.id === jobId
              ? {
                  ...v,
                  yt_video_id: data.yt_video_id,
                  yt_video_url: data.yt_video_url,
                }
              : v,
          ),
        );
        showToast(`Published to YouTube!`);
      } catch (err: any) {
        console.error(`[Publish] Error for ${jobId}:`, err);
      }
    }

    setPublishingIds(new Set());
    setShowPublishModal(false);
  };

  // Collect unique tags from all videos for filter chips
  const availableTags = useCallback(() => {
    const tags = new Set<string>();
    videos.forEach((v) => v.tags?.forEach((t) => tags.add(t)));
    return [...tags].sort();
  }, [videos]);

  // Filter video jobs
  const filteredVideos = videos.filter((video) => {
    const matchesSearch = video.title
      .toLowerCase()
      .includes(searchQuery.toLowerCase());

    let matchesTab = true;
    if (activeTab === "completed") {
      matchesTab = video.status === "completed";
    } else if (activeTab === "processing") {
      matchesTab = ["generating", "generating_voice", "compositing"].includes(
        video.status,
      );
    } else if (activeTab === "failed") {
      matchesTab = video.status === "failed";
    }

    const matchesTag =
      !activeTagFilter || (video.tags && video.tags.includes(activeTagFilter));

    return matchesSearch && matchesTab && matchesTag;
  });

  return (
    <div className="pt-24 pb-12 min-h-screen bg-[#0A0A0A]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">
              Videos
            </h1>
            <p className="text-zinc-400 mt-1.5 text-sm">
              Create, manage, and play your Shorts automatically compiled and
              saved to Cloudflare R2.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              onClick={() => setShowTagManager(true)}
              className="flex items-center gap-2 bg-[#1A1A1A] border-[#2A2A2A] text-zinc-300 hover:bg-[#252525] hover:text-white"
            >
              <Tag className="w-4 h-4" /> Tags
            </Button>
            <Button
              onClick={() => navigate("/video")}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Create Short
            </Button>
          </div>
        </div>

        {/* Search, Select Toggle & Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <Input
              placeholder="Search videos by title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-[#111111] border-[#1D1D1D] text-[#E8E8E8] placeholder:text-zinc-600 focus:border-[#10b981] h-11"
            />
          </div>
          <Button
            variant={selectionMode ? "primary" : "secondary"}
            size="sm"
            onClick={() => {
              setSelectionMode(!selectionMode);
              if (selectionMode) setSelectedIds(new Set());
            }}
            className="flex items-center gap-2 shrink-0"
          >
            {selectionMode ? (
              <>
                <CheckSquare className="w-4 h-4" /> Done
              </>
            ) : (
              <>
                <Square className="w-4 h-4" /> Select
              </>
            )}
          </Button>
        </div>

        {/* Tag Filter Chips */}
        {availableTags().length > 0 && (
          <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
            <button
              onClick={() => setActiveTagFilter(null)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors shrink-0 ${
                !activeTagFilter
                  ? "bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/30"
                  : "bg-[#1A1A1A] text-zinc-400 border border-[#2A2A2A] hover:border-zinc-600"
              }`}
            >
              <Layers className="w-3 h-3 inline mr-1" />
              All
            </button>
            {availableTags().map((tag) => (
              <button
                key={tag}
                onClick={() =>
                  setActiveTagFilter(activeTagFilter === tag ? null : tag)
                }
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors shrink-0 ${
                  activeTagFilter === tag
                    ? "bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/30"
                    : "bg-[#1A1A1A] text-zinc-400 border border-[#2A2A2A] hover:border-zinc-600"
                }`}
              >
                <Tag className="w-3 h-3 inline mr-1" />
                {tag}
              </button>
            ))}
          </div>
        )}

        {/* Status Tabs */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2 border-b border-zinc-900">
          {[
            { key: "all", label: "All Jobs" },
            { key: "completed", label: "Completed" },
            { key: "processing", label: "In Progress" },
            { key: "failed", label: "Failed" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2.5 rounded-t-lg text-sm font-medium transition-colors border-b-2 -mb-[2px] ${
                activeTab === tab.key
                  ? "border-[#10b981] text-[#10b981] font-semibold"
                  : "border-transparent text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Loading and Error States */}
        {isLoading && (
          <div className="text-center py-20">
            <div className="w-8 h-8 border-2 border-[#10b981] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-zinc-500 text-sm">
              Retrieving automated video assets...
            </p>
          </div>
        )}

        {error && (
          <div className="max-w-md mx-auto text-center py-12 bg-red-500/5 rounded-xl border border-red-500/10 p-6">
            <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
            <h3 className="text-[#E8E8E8] font-medium mb-1">
              Retrieval Failed
            </h3>
            <p className="text-xs text-zinc-500 mb-4 flex justify-center">
              {error}
            </p>
            <Button onClick={fetchVideos} size="sm" className="mx-auto block">
              Retry Connection
            </Button>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && filteredVideos.length === 0 && (
          <div className="text-center py-20 bg-[#111111]/30 rounded-xl border border-[#161616] p-8">
            <Calendar className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
            <p className="text-zinc-400 font-medium mb-1">No videos found</p>
            <p className="text-xs text-zinc-600 max-w-sm mx-auto mb-6">
              Create a short to trigger the automated generation pipeline and
              compile video structures.
            </p>
            <Button
              variant="secondary"
              onClick={() => navigate("/video")}
              size="sm"
            >
              Create a Short now
            </Button>
          </div>
        )}

        {/* Videos Grid */}
        {!isLoading && !error && filteredVideos.length > 0 && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVideos.map((video, index) => (
              <motion.div
                key={video.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: index * 0.04 }}
              >
                <Card className="overflow-hidden bg-[#111111] border-[#1D1D1D] hover:border-zinc-800 transition-all rounded-xl shadow-md">
                  {/* Thumbnail / Status Shell */}
                  <div className="relative aspect-video bg-zinc-950 flex items-center justify-center border-b border-[#1A1A1A]">
                    {video.status === "completed" ? (
                      <div
                        className="absolute inset-0 flex items-center justify-center bg-zinc-900 group cursor-pointer overflow-hidden"
                        onClick={() => {
                          if (selectionMode) {
                            toggleSelection(video.id);
                          } else {
                            setPlayingVideoId(video.id);
                            setPlayingVideoIdTitle(video.title);
                          }
                        }}
                      >
                        {/* Show thumbnail (first frame extracted by pipeline) */}
                        {(() => {
                          const thumbSrc =
                            video.thumbnail_url ||
                            `/api/video/preview/${video.id}`;
                          return (
                            <img
                              src={thumbSrc}
                              alt={video.title}
                              className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                              loading="lazy"
                              onError={(e) => {
                                // Fallback: use the video's R2 URL directly as an image
                                const el = e.target as HTMLImageElement;
                                if (video.r2_url && el.src !== video.r2_url) {
                                  el.src = video.r2_url;
                                }
                              }}
                            />
                          );
                        })()}
                        {/* Subtle gradient so edges read against light frames */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                      </div>
                    ) : (
                      <div className="text-center p-4">
                        <div className="w-6 h-6 border-2 border-zinc-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                        <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono">
                          automated assembly
                        </span>
                      </div>
                    )}

                    {/* Format Label */}
                    <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/60 backdrop-blur-sm rounded text-[10px] uppercase font-mono tracking-wider text-zinc-400">
                      {video.format === "reddit_story"
                        ? "Reddit Short"
                        : "POV Short"}
                    </div>

                    {/* Selection Checkbox */}
                    {selectionMode && (
                      <div
                        className="absolute top-2 left-2 z-20"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSelection(video.id);
                        }}
                      >
                        <div
                          className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors cursor-pointer ${
                            selectedIds.has(video.id)
                              ? "bg-[#10b981] border-[#10b981]"
                              : "bg-black/40 border-white/40 hover:border-white"
                          }`}
                        >
                          {selectedIds.has(video.id) && (
                            <CheckSquare className="w-4 h-4 text-white" />
                          )}
                        </div>
                      </div>
                    )}

                    {/* Status Badge */}
                    <Badge
                      variant="default"
                      className={`absolute top-2 right-2 text-[10px] py-0.5 px-2 border uppercase tracking-wider rounded font-semibold ${statusColors[video.status] || "bg-zinc-800 text-zinc-400 border-zinc-700"}`}
                    >
                      {statusLabels[video.status] || video.status}
                    </Badge>
                  </div>

                  {/* Card Info */}
                  <CardContent className="p-5">
                    <h3
                      className="font-semibold text-white mb-1.5 text-base line-clamp-1 leading-snug"
                      title={video.title}
                    >
                      {video.title}
                    </h3>
                    <div className="flex items-center gap-1 text-xs text-zinc-500">
                      <span>Job:</span>
                      <span className="font-mono text-[10px] text-zinc-400">
                        {video.id.substring(0, 8)}
                      </span>
                      <span>·</span>
                      <span>
                        {new Date(video.created_at).toLocaleDateString(
                          undefined,
                          {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          },
                        )}
                      </span>
                    </div>

                    {/* Tag Badges */}
                    {video.tags && video.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2.5">
                        {video.tags.map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#10b981]/10 text-[#10b981] text-[10px] font-medium border border-[#10b981]/20"
                          >
                            <Tag className="w-2.5 h-2.5" />
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {video.status === "failed" && video.error_message && (
                      <div className="mt-3 p-2.5 bg-rose-500/5 rounded-lg border border-rose-500/10 text-[11px] text-rose-400 font-medium leading-relaxed max-h-12 overflow-y-auto font-mono">
                        {video.error_message}
                      </div>
                    )}

                    {/* Action Panel */}
                    <div className="flex items-center justify-end gap-1 mt-4 pt-4 border-t border-[#1C1C1C]">
                      {video.status === "completed" && (
                        <button
                          onClick={() => {
                            setPlayingVideoId(video.id);
                            setPlayingVideoIdTitle(video.title);
                          }}
                          className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-[#10b981] transition-colors"
                          title="Play Video"
                        >
                          <Play className="w-4 h-4" />
                        </button>
                      )}

                      <button
                        onClick={() => {
                          setEditingVideo(video);
                          setEditTitleValue(video.title);
                        }}
                        className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors"
                        title="Edit Title"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      {video.status === "completed" && !video.yt_video_id && (
                        <button
                          onClick={() => {
                            setSelectedPublishIds(new Set([video.id]));
                            loadPublishTargets();
                          }}
                          className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-[#10b981] transition-colors"
                          title="Publish to YouTube"
                        >
                          <Upload className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteClick(video.id, video.title)}
                        className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-rose-400 transition-colors"
                        title="Delete Asset"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* ── Bulk Action Bar ── */}
      <AnimatePresence>
        {selectedIds.size > 0 && (
          <motion.div
            initial={{ y: 100, x: "-50%", opacity: 0 }}
            animate={{ y: 0, x: "-50%", opacity: 1 }}
            exit={{ y: 100, x: "-50%", opacity: 0 }}
            className="fixed bottom-6 left-1/2 z-40 bg-[#111111] border border-[#2A2A2A] rounded-xl shadow-2xl px-5 py-3 flex items-center gap-4"
          >
            <span className="text-sm text-zinc-400 font-medium whitespace-nowrap">
              {selectedIds.size} selected
            </span>
            <div className="w-px h-5 bg-[#2A2A2A]" />
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setShowTagModal(true)}
              className="flex items-center gap-2"
              disabled={isTagSaving}
            >
              <Tag className="w-4 h-4" /> Tag
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                setSelectedPublishIds(selectedIds);
                loadPublishTargets();
              }}
              className="flex items-center gap-2"
            >
              <Upload className="w-4 h-4" /> Publish
            </Button>
            <Button
              size="sm"
              onClick={handleBatchDeleteClick}
              className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white"
              disabled={isDeletingSelected}
            >
              <Trash2 className="w-4 h-4" />
              {isDeletingSelected ? "Deleting..." : "Delete"}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Publish to YouTube Modal ── */}
      <AnimatePresence>
        {showPublishModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
            onClick={() => setShowPublishModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#111111] border border-[#202020] rounded-xl p-6 w-full max-w-md shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-white">
                  Publish to YouTube
                </h4>
                <button
                  onClick={() => setShowPublishModal(false)}
                  className="text-zinc-500 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs text-zinc-500 mb-4">
                Select a YouTube channel to publish {selectedPublishIds.size}{" "}
                video{selectedPublishIds.size !== 1 ? "s" : ""} to.
              </p>

              {publishTargets.length === 0 ? (
                <div className="text-center py-8 text-zinc-500 text-sm">
                  <Youtube className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
                  <p className="font-medium text-zinc-400">
                    No accounts connected
                  </p>
                  <p className="text-xs text-zinc-600 mt-1">
                    Go to Accounts to link a YouTube channel first.
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {publishTargets.map((account: any) => {
                    const isPublishing = publishingIds.size > 0;
                    return (
                      <button
                        key={account.id}
                        disabled={isPublishing}
                        onClick={() => handlePublish(account.id)}
                        className="w-full flex items-center gap-3 p-3.5 bg-[#181818] rounded-lg border border-[#222222] hover:border-[#10b981]/50 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed group"
                      >
                        <div className="w-10 h-10 rounded-full bg-rose-500/10 flex items-center justify-center shrink-0">
                          <Youtube className="w-5 h-5 text-rose-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-zinc-200 truncate">
                            {account.channel_name || "Unnamed Channel"}
                          </p>
                          <p className="text-xs text-zinc-500">
                            {account.subscriber_count > 0
                              ? `${(account.subscriber_count / 1000).toFixed(1)}K subscribers`
                              : "No subscriber data"}
                            {account.video_count > 0 &&
                              ` · ${account.video_count} videos`}
                          </p>
                        </div>
                        <Upload className="w-4 h-4 text-zinc-600 group-hover:text-[#10b981] transition-colors shrink-0" />
                      </button>
                    );
                  })}
                </div>
              )}

              <div className="mt-4 pt-4 border-t border-[#1C1C1C]">
                <Button
                  variant="secondary"
                  onClick={() => setShowPublishModal(false)}
                  className="w-full"
                  disabled={publishingIds.size > 0}
                >
                  {publishingIds.size > 0 ? "Publishing..." : "Cancel"}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Tag Modal ── */}
      <AnimatePresence>
        {showTagModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
            onClick={() => setShowTagModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#111111] border border-[#202020] rounded-xl p-6 w-full max-w-md shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-white">
                  Manage Tags
                </h4>
                <button
                  onClick={() => setShowTagModal(false)}
                  className="text-zinc-500 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs text-zinc-500 mb-4">
                {selectedIds.size} video{selectedIds.size !== 1 ? "s" : ""}{" "}
                selected. Add or remove tags below.
              </p>

              {/* Current Tags */}
              <div className="mb-4">
                <label className="text-xs text-zinc-500 font-medium mb-2 block">
                  Current Tags
                </label>
                <div className="flex flex-wrap gap-2 min-h-[32px] p-2 bg-[#181818] rounded-lg border border-[#222222]">
                  {/* Collect common tags from selected videos */}
                  {(() => {
                    const selected = videos.filter((v) =>
                      selectedIds.has(v.id),
                    );
                    const commonTags = [
                      ...new Set(selected.flatMap((v) => v.tags || [])),
                    ].sort();
                    if (commonTags.length === 0) {
                      return (
                        <span className="text-xs text-zinc-600 italic">
                          No tags
                        </span>
                      );
                    }
                    return commonTags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#10b981]/10 text-[#10b981] text-xs font-medium border border-[#10b981]/20"
                      >
                        {tag}
                        <button
                          onClick={() => handleTagUpdate("remove", [tag])}
                          className="hover:text-rose-400 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ));
                  })()}
                </div>
              </div>

              {/* Add Tags */}
              <div className="space-y-3">
                <div className="space-y-2">
                  <label className="text-xs text-zinc-500 font-medium">
                    Add Tags
                  </label>
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      placeholder="Type a tag name..."
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && tagInput.trim()) {
                          handleTagUpdate("add", [tagInput.trim()]);
                          setTagInput("");
                        }
                      }}
                      className="flex-1 bg-[#181818] border-[#222222] focus:border-[#10b981] text-white h-11"
                      disabled={isTagSaving}
                    />
                    <Button
                      size="sm"
                      onClick={() => {
                        if (tagInput.trim()) {
                          handleTagUpdate("add", [tagInput.trim()]);
                          setTagInput("");
                        }
                      }}
                      disabled={isTagSaving || !tagInput.trim()}
                    >
                      {isTagSaving ? "..." : "Add"}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-[#1C1C1C]">
                <Button
                  variant="secondary"
                  onClick={() => setShowTagModal(false)}
                  className="w-full"
                >
                  Done
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Global Tag Manager Modal ── */}
      <AnimatePresence>
        {showTagManager && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
            onClick={() => setShowTagManager(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#111111] border border-[#202020] rounded-xl p-6 w-full max-w-md shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-white">
                  Manage Tags
                </h4>
                <button
                  onClick={() => setShowTagManager(false)}
                  className="text-zinc-500 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs text-zinc-500 mb-4">
                All tags used across your videos. Click the X to delete a tag
                from all videos.
              </p>

              {availableTags().length === 0 ? (
                <div className="text-center py-8 text-zinc-600 text-sm">
                  No tags yet. Select videos and use the Tag button to add tags.
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {availableTags().map((tag) => (
                    <div
                      key={tag}
                      className="flex items-center justify-between px-3 py-2.5 bg-[#181818] rounded-lg border border-[#222222] group"
                    >
                      <span className="text-sm text-zinc-300 flex items-center gap-2">
                        <Tag className="w-3.5 h-3.5 text-[#10b981]" />
                        {tag}
                      </span>
                      <button
                        onClick={() => handleDeleteTag(tag)}
                        className="p-1 rounded-md text-zinc-600 hover:text-rose-400 hover:bg-rose-500/10 transition-colors opacity-0 group-hover:opacity-100"
                        title={`Delete "${tag}"`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Create Tag */}
              <div className="mt-4 pt-4 border-t border-[#1C1C1C] space-y-3">
                <label className="text-xs text-zinc-500 font-medium">
                  Create Tag
                </label>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    placeholder="Type a tag name..."
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && tagInput.trim()) {
                        handleGlobalAddTag(tagInput);
                        setTagInput("");
                      }
                    }}
                    className="flex-1 bg-[#181818] border-[#222222] focus:border-[#10b981] text-white h-11"
                    disabled={isTagSaving}
                  />
                  <Button
                    size="sm"
                    onClick={() => {
                      if (tagInput.trim()) {
                        handleGlobalAddTag(tagInput);
                        setTagInput("");
                      }
                    }}
                    disabled={isTagSaving || !tagInput.trim()}
                  >
                    {isTagSaving ? "..." : "Add"}
                  </Button>
                </div>
                <Button
                  variant="secondary"
                  onClick={() => setShowTagManager(false)}
                  className="w-full"
                >
                  Done
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Delete Confirmation Modal ── */}
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
            onClick={() => setDeleteConfirm(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#111111] border border-[#202020] rounded-xl p-6 w-full max-w-sm shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-rose-500/10 flex items-center justify-center shrink-0">
                  <Trash2 className="w-5 h-5 text-rose-500" />
                </div>
                <div>
                  <h4 className="text-base font-semibold text-[#E8E8E8]">
                    {deleteConfirm.batch ? "Delete Videos" : "Delete Video"}
                  </h4>
                  <p className="text-xs text-[#909090]">
                    This action cannot be undone.
                  </p>
                </div>
              </div>

              <p className="text-sm text-[#909090] mb-6">
                Are you sure you want to delete{" "}
                <span className="text-[#E8E8E8] font-medium">
                  "{deleteConfirm.title}"
                </span>
                ?
              </p>

              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={
                    deleteConfirm.batch ? executeBatchDelete : executeDelete
                  }
                  className="flex-1 bg-rose-600 hover:bg-rose-700 text-white"
                >
                  Delete
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Toast Message Overlay ── */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: 30, x: "-50%" }}
            className="fixed bottom-6 left-1/2 z-50 bg-[#10b981] text-zinc-950 font-bold px-5 py-3 rounded-lg text-sm shadow-xl"
          >
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Rename / Edit Title Modal ── */}
      <AnimatePresence>
        {editingVideo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#111111] border border-[#202020] rounded-xl p-6 w-full max-w-md shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-white">
                  Rename Video Job
                </h4>
                <button
                  onClick={() => setEditingVideo(null)}
                  className="text-zinc-500 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="space-y-2 text-left">
                  <label className="text-xs text-zinc-500 font-medium">
                    New Title
                  </label>
                  <Input
                    type="text"
                    value={editTitleValue}
                    onChange={(e) => setEditTitleValue(e.target.value)}
                    className="bg-[#181818] border-[#222222] focus:border-[#10b981] text-white h-11"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    variant="secondary"
                    onClick={() => setEditingVideo(null)}
                    className="flex-1"
                    disabled={isSavingEdit}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSaveEdit}
                    className="flex-1"
                    disabled={isSavingEdit}
                  >
                    {isSavingEdit ? "Saving..." : "Save Title"}
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Playing Video Overlay (9:16 Vertical Shorts Mode) ── */}
      <AnimatePresence>
        {playingVideoId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
            onClick={() => setPlayingVideoId(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative flex flex-col items-center gap-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between w-full max-w-[280px]">
                <h4 className="text-sm font-semibold text-white truncate pr-4 max-w-[200px]">
                  {playingVideoTitle}
                </h4>
                <button
                  onClick={() => setPlayingVideoId(null)}
                  className="text-zinc-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* 9:16 Player Area */}
              <div
                className="relative bg-zinc-950 rounded-2xl overflow-hidden shadow-2xl border border-zinc-800"
                style={{ width: 280, height: 497 }}
              >
                <video
                  src={`/api/video/preview/${playingVideoId}`}
                  controls
                  autoPlay
                  playsInline
                  className="absolute inset-0 w-full h-full object-cover"
                />
              </div>

              <a
                href={`/api/video/preview/${playingVideoId}`}
                download={`short-${playingVideoId}.mp4`}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#10b981] text-zinc-950 text-xs font-bold hover:bg-[#10b981]/90 transition-colors"
              >
                <Download className="w-4 h-4" /> Download Video File
              </a>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
