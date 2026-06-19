import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Search,
  Filter,
  MoreVertical,
  RefreshCw,
  Trash2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Youtube,
  Upload,
  Link2,
  Clock,
  X,
  ExternalLink,
  Clock4,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface YouTubeAccount {
  id: string;
  email: string;
  channel_name: string | null;
  channel_id: string | null;
  status: "active" | "pending" | "suspended";
  subscriber_count: number;
  video_count: number;
  last_sync_at: string | null;
  created_at: string;
}

const statusIcons = {
  active: CheckCircle,
  pending: AlertCircle,
  suspended: XCircle,
};

const statusColors = {
  active: "bg-[#10b981]/10 text-[#10b981] border-[#10b981]/20",
  pending: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  suspended: "bg-rose-500/10 text-rose-400 border-rose-500/20",
};

type FilterType = "all" | "connected" | "pending";

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return "Never";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export function Accounts() {
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [accounts, setAccounts] = useState<YouTubeAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState<string | null>(null);
  const [showAddDrawer, setShowAddDrawer] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [menuPos, setMenuPos] = useState<{ x: number; y: number } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    id: string;
    title: string;
  } | null>(null);

  // Get filter from URL query params
  const urlFilter = searchParams.get("filter") as FilterType | null;
  const activeFilter: FilterType = ["all", "connected", "pending"].includes(
    urlFilter || "",
  )
    ? urlFilter!
    : "all";

  // Fetch accounts
  const fetchAccounts = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/accounts", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch accounts");
      const data = await res.json();
      setAccounts(data.accounts || []);
      setError(null);
    } catch (err: any) {
      console.error("Error fetching accounts:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();

    // Listen for OAuth success from the popup/redirect tab
    const handleOAuthMessage = (event: MessageEvent) => {
      if (event.data?.type === "youtube-oauth-success") {
        console.log("[Accounts] OAuth completed, refetching accounts...");
        fetchAccounts();
      }
    };
    window.addEventListener("message", handleOAuthMessage);
    return () => window.removeEventListener("message", handleOAuthMessage);
  }, []);

  // Close menu when clicking outside or scrolling
  useEffect(() => {
    if (!openMenuId) return;
    const close = () => {
      setOpenMenuId(null);
      setMenuPos(null);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("scroll", close, true);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("scroll", close, true);
    };
  }, [openMenuId]);

  const filteredAccounts = accounts.filter((account) => {
    const name = account.channel_name || "";
    const matchesSearch =
      name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      account.email.toLowerCase().includes(searchQuery.toLowerCase());

    if (activeFilter === "connected")
      return matchesSearch && account.status === "active";
    if (activeFilter === "pending")
      return matchesSearch && account.status === "pending";
    return matchesSearch;
  });

  const handleRefresh = async (accountId: string) => {
    setRefreshing(accountId);
    try {
      const res = await fetch(`/api/accounts/${accountId}/sync`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Sync failed");
      const data = await res.json();
      setAccounts((prev) =>
        prev.map((a) => (a.id === accountId ? { ...a, ...data.account } : a)),
      );
    } catch (err: any) {
      console.error("Sync error:", err);
    } finally {
      setRefreshing(null);
    }
  };

  const handleDeleteConfirm = (id: string, title: string) => {
    setDeleteConfirm({ id, title });
    setOpenMenuId(null);
    setMenuPos(null);
  };

  const executeDelete = async () => {
    if (!deleteConfirm) return;
    const accountId = deleteConfirm.id;
    setDeleting(accountId);
    setDeleteConfirm(null);
    try {
      const res = await fetch(`/api/accounts/${accountId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete");
      setAccounts((prev) => prev.filter((a) => a.id !== accountId));
    } catch (err: any) {
      console.error("Delete error:", err);
      alert("Failed to delete account.");
    } finally {
      setDeleting(null);
    }
  };

  const connectedCount = accounts.filter((a) => a.status === "active").length;
  const pendingCount = accounts.filter((a) => a.status === "pending").length;

  return (
    <div className="pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[#E8E8E8]">
              YouTube Accounts
            </h1>
            <p className="text-[#909090] mt-1">
              Manage your connected channels
            </p>
          </div>
          <div className="flex gap-3">
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-[#1A1A1A] bg-[#141414] text-[#909090] hover:text-[#E8E8E8] hover:border-[#252525] transition-colors">
              <Upload className="w-4 h-4" /> Import CSV
            </button>
            <button
              onClick={() => setShowAddDrawer(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-[#E8E8E8] text-[#0A0A0A] hover:bg-[#F5F5F5] transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Account
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid sm:grid-cols-3 gap-4 mb-6">
          <Card hover={false}>
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#1A1A1A] rounded-lg flex items-center justify-center">
                  <Link2 className="w-5 h-5 text-[#10b981]" />
                </div>
                <div>
                  <p className="text-xs text-[#909090]">Total Accounts</p>
                  <p className="text-2xl font-bold text-[#E8E8E8]">
                    {accounts.length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card hover={false}>
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#10b981]/10 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-[#10b981]" />
                </div>
                <div>
                  <p className="text-xs text-[#909090]">Connected</p>
                  <p className="text-2xl font-bold text-[#10b981]">
                    {connectedCount}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card hover={false}>
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-500/10 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <p className="text-xs text-[#909090]">Pending</p>
                  <p className="text-2xl font-bold text-amber-400">
                    {pendingCount}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#505050]" />
            <Input
              placeholder="Search accounts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-[#141414] border-[#1A1A1A] text-[#E8E8E8] placeholder:text-[#505050]"
            />
          </div>
          <Button variant="secondary" className="sm:w-auto">
            <Filter className="w-4 h-4 mr-2" /> Filter
          </Button>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-20">
            <div className="w-8 h-8 border-2 border-[#10b981] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-[#909090] text-sm">Loading accounts...</p>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="max-w-md mx-auto text-center py-12 bg-red-500/5 rounded-xl border border-red-500/10 p-6">
            <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
            <h3 className="text-[#E8E8E8] font-medium mb-1">Failed to Load</h3>
            <p className="text-xs text-[#505050] mb-4">{error}</p>
            <Button onClick={fetchAccounts} size="sm" className="mx-auto block">
              Retry
            </Button>
          </div>
        )}

        {/* Accounts Table */}
        {!isLoading && !error && (
          <Card hover={false}>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#1A1A1A]">
                      <th className="text-left p-4 text-xs uppercase tracking-wider text-[#505050] font-semibold">
                        Channel
                      </th>
                      <th className="text-left p-4 text-xs uppercase tracking-wider text-[#505050] font-semibold">
                        Status
                      </th>
                      <th className="text-left p-4 text-xs uppercase tracking-wider text-[#505050] font-semibold">
                        Subscribers
                      </th>
                      <th className="text-left p-4 text-xs uppercase tracking-wider text-[#505050] font-semibold">
                        Videos
                      </th>
                      <th className="text-left p-4 text-xs uppercase tracking-wider text-[#505050] font-semibold">
                        Last Sync
                      </th>
                      <th className="text-right p-4 text-xs uppercase tracking-wider text-[#505050] font-semibold">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <AnimatePresence mode="wait">
                      {filteredAccounts.map((account, index) => {
                        const StatusIcon = statusIcons[account.status];
                        return (
                          <motion.tr
                            key={account.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ delay: index * 0.03 }}
                            className="border-b border-[#1A1A1A]/50 hover:bg-[#1A1A1A]/30 transition-colors"
                          >
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-[#1A1A1A] rounded-lg flex items-center justify-center">
                                  <Youtube className="w-5 h-5 text-rose-500" />
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-[#E8E8E8]">
                                    {account.channel_name || "Unnamed Channel"}
                                  </p>
                                  <p className="text-xs text-[#909090]">
                                    {account.email}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="p-4">
                              <Badge
                                variant="default"
                                className={`${statusColors[account.status]} border text-xs capitalize`}
                              >
                                <StatusIcon className="w-3 h-3 mr-1" />
                                {account.status}
                              </Badge>
                            </td>
                            <td className="p-4">
                              <span className="text-sm font-semibold text-[#E8E8E8]">
                                {formatCount(account.subscriber_count)}
                              </span>
                            </td>
                            <td className="p-4">
                              <span className="text-sm text-[#909090]">
                                {account.video_count}
                              </span>
                            </td>
                            <td className="p-4">
                              <span className="text-sm text-[#505050] flex items-center gap-1">
                                <Clock4 className="w-3 h-3" />
                                {timeAgo(account.last_sync_at)}
                              </span>
                            </td>
                            <td className="p-4 relative">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  onClick={() => handleRefresh(account.id)}
                                  className="p-2 hover:bg-[#1A1A1A] rounded-lg transition-colors"
                                  title="Sync account"
                                  disabled={refreshing === account.id}
                                >
                                  <RefreshCw
                                    className={`w-4 h-4 text-[#909090] ${refreshing === account.id ? "animate-spin" : ""}`}
                                  />
                                </button>
                                <button
                                  onClick={() =>
                                    handleDeleteConfirm(
                                      account.id,
                                      account.channel_name || account.email,
                                    )
                                  }
                                  className="p-2 hover:bg-[#1A1A1A] rounded-lg transition-colors"
                                  title="Remove account"
                                  disabled={deleting === account.id}
                                >
                                  {deleting === account.id ? (
                                    <div className="w-4 h-4 border-2 border-rose-400 border-t-transparent rounded-full animate-spin" />
                                  ) : (
                                    <Trash2 className="w-4 h-4 text-[#909090] hover:text-rose-400" />
                                  )}
                                </button>
                                <div>
                                  <button
                                    onClick={(e) => {
                                      if (openMenuId === account.id) {
                                        setOpenMenuId(null);
                                        setMenuPos(null);
                                      } else {
                                        const rect = (
                                          e.currentTarget as HTMLElement
                                        ).getBoundingClientRect();
                                        setMenuPos({
                                          x: rect.right,
                                          y: rect.bottom,
                                        });
                                        setOpenMenuId(account.id);
                                      }
                                    }}
                                    className="p-2 hover:bg-[#1A1A1A] rounded-lg transition-colors"
                                  >
                                    <MoreVertical className="w-4 h-4 text-[#909090]" />
                                  </button>
                                </div>
                              </div>
                            </td>
                          </motion.tr>
                        );
                      })}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
              {filteredAccounts.length === 0 && (
                <div className="p-12 text-center">
                  <div className="w-16 h-16 bg-[#1A1A1A] rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="w-8 h-8 text-[#505050]" />
                  </div>
                  <p className="text-[#909090] mb-2">No accounts found</p>
                  <p className="text-sm text-[#505050]">
                    {accounts.length === 0
                      ? "Add your first YouTube account to get started"
                      : "Try adjusting your search or filter"}
                  </p>
                  {accounts.length === 0 && (
                    <Button
                      onClick={() => setShowAddDrawer(true)}
                      className="mt-4"
                      size="sm"
                    >
                      <Plus className="w-4 h-4 mr-1" /> Add Account
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Add Account Drawer */}
        <AnimatePresence>
          {showAddDrawer && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowAddDrawer(false)}
                className="fixed inset-0 bg-black/60 z-40"
              />
              <motion.div
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="fixed right-0 top-0 h-full w-full max-w-md bg-[#0A0A0A] border-l border-[#1A1A1A] z-50 shadow-2xl"
              >
                <div className="p-6 border-b border-[#1A1A1A]">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-[#E8E8E8]">
                        Add YouTube Account
                      </h3>
                      <p className="text-xs text-[#505050]">
                        Connect a new channel
                      </p>
                    </div>
                    <button
                      onClick={() => setShowAddDrawer(false)}
                      className="p-2 hover:bg-[#1A1A1A] rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5 text-[#909090]" />
                    </button>
                  </div>
                </div>

                <div className="p-6 space-y-6">
                  {/* Connect Method */}
                  <div className="space-y-3">
                    <label className="text-sm text-[#909090]">
                      Connection Method
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-4 rounded-lg text-left border border-[#10b981] bg-[#10b981]/10">
                        <Youtube className="w-6 h-6 text-rose-500 mb-2" />
                        <p className="text-sm font-medium text-[#E8E8E8]">
                          YouTube OAuth
                        </p>
                        <p className="text-xs text-[#505050]">Recommended</p>
                      </div>
                      <div className="p-4 rounded-lg text-left transition-colors relative overflow-hidden border border-[#1A1A1A] bg-[#141414]">
                        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-zinc-950/60 backdrop-blur-sm rounded-lg">
                          <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                            Coming Soon
                          </p>
                        </div>
                        <Upload className="w-6 h-6 text-[#909090] mb-2 opacity-30" />
                        <p className="text-sm font-medium text-[#E8E8E8] opacity-30">
                          API Key
                        </p>
                        <p className="text-xs text-[#505050] opacity-30">
                          Manual
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Instructions */}
                  <div className="p-4 rounded-lg bg-[#141414] border border-[#1A1A1A]">
                    <p className="text-sm text-[#909090] mb-2">
                      Connect your YouTube channel
                    </p>
                    <ul className="text-xs text-[#505050] space-y-1 list-disc list-inside">
                      <li>You'll be redirected to Google to authorize</li>
                      <li>Grant upload permissions to your channel</li>
                      <li>Your account will be linked automatically</li>
                    </ul>
                  </div>
                </div>

                {/* Footer */}
                <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-[#1A1A1A] bg-[#0A0A0A]">
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setShowAddDrawer(false);
                      }}
                      className="flex-1 px-4 py-2 rounded-lg text-sm text-[#909090] hover:bg-[#1A1A1A] transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        window.open(
                          "/auth/youtube",
                          "_blank",
                          "noopener,noreferrer",
                        );
                        setShowAddDrawer(false);
                      }}
                      className="flex-1 px-4 py-2 rounded-lg text-sm font-medium bg-[#10b981] text-white hover:bg-[#0ea371] transition-colors"
                    >
                      Connect with Google
                    </button>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
        {/* ── Fixed-position dropdown menu ── */}
        <AnimatePresence>
          {openMenuId &&
            menuPos &&
            (() => {
              const account = accounts.find((a) => a.id === openMenuId);
              if (!account) return null;
              return (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  style={{
                    position: "fixed",
                    left: Math.min(menuPos.x - 192, window.innerWidth - 208),
                    top: menuPos.y + 4,
                  }}
                  className="z-50 w-48 bg-[#141414] border border-[#252525] rounded-xl shadow-2xl py-1 overflow-hidden"
                >
                  <button
                    onClick={() => {
                      handleRefresh(account.id);
                      setOpenMenuId(null);
                      setMenuPos(null);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#E8E8E8] hover:bg-[#1A1A1A] transition-colors text-left"
                  >
                    <RefreshCw className="w-4 h-4 text-[#909090]" />
                    Sync Now
                  </button>
                  <button
                    onClick={() => {
                      window.open(
                        `https://www.youtube.com/channel/${account.channel_id}`,
                        "_blank",
                      );
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#E8E8E8] hover:bg-[#1A1A1A] transition-colors text-left"
                  >
                    <ExternalLink className="w-4 h-4 text-[#909090]" />
                    View Channel
                  </button>
                  <div className="h-px bg-[#252525] my-1" />
                  <button
                    onClick={() =>
                      handleDeleteConfirm(
                        account.id,
                        account.channel_name || account.email,
                      )
                    }
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-rose-400 hover:bg-rose-500/10 transition-colors text-left"
                  >
                    <Trash2 className="w-4 h-4" />
                    Remove Account
                  </button>
                </motion.div>
              );
            })()}
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
                      Remove Account
                    </h4>
                    <p className="text-xs text-[#909090]">
                      This action cannot be undone.
                    </p>
                  </div>
                </div>

                <p className="text-sm text-[#909090] mb-6">
                  Are you sure you want to remove{" "}
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
                    onClick={executeDelete}
                    className="flex-1 bg-rose-600 hover:bg-rose-700 text-white"
                    disabled={deleting === deleteConfirm.id}
                  >
                    {deleting === deleteConfirm.id ? "Deleting..." : "Delete"}
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
