import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  Clock,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Globe,
  Sun,
  SunMoon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Schedule {
  id: string;
  day_of_week: number;
  time_utc: string;
  enabled: boolean;
  last_run_at: string | null;
  created_at: string;
}

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const DAY_ICONS = [Sun, SunMoon, Sun, SunMoon, Sun, SunMoon, Globe];

function formatTime(timeUtc: string): string {
  const [h, m] = timeUtc.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${m.toString().padStart(2, "0")} ${period} UTC`;
}

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return "Never";
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function Automation() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newDay, setNewDay] = useState(1);
  const [newTime, setNewTime] = useState("09:00");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }, []);

  const fetchSchedules = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/automation/schedules", {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to load schedules");
      const data = await res.json();
      setSchedules(data.schedules || []);
    } catch (err) {
      console.error("Error fetching schedules:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/automation/schedules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          day_of_week: newDay,
          time_utc: newTime,
          enabled: true,
        }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to save");
      const data = await res.json();
      setSchedules((prev) => [...prev, data.schedule]);
      setShowForm(false);
      showToast("Schedule created!");
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (schedule: Schedule) => {
    try {
      const res = await fetch("/api/automation/schedules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: schedule.id,
          day_of_week: schedule.day_of_week,
          time_utc: schedule.time_utc,
          enabled: !schedule.enabled,
        }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update");
      setSchedules((prev) =>
        prev.map((s) =>
          s.id === schedule.id ? { ...s, enabled: !s.enabled } : s,
        ),
      );
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this schedule?")) return;
    try {
      const res = await fetch(`/api/automation/schedules/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete");
      setSchedules((prev) => prev.filter((s) => s.id !== id));
      showToast("Schedule deleted.");
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="pt-24 pb-12 min-h-screen bg-[#0A0A0A]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Automation</h1>
            <p className="text-zinc-400 mt-1">
              Schedule videos to publish automatically
            </p>
          </div>
        </div>

        {/* Schedules Section */}
        <div className="bg-zinc-900/50 rounded-xl border border-zinc-800/50 overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-zinc-800/50">
            <div>
              <h2 className="text-sm font-semibold text-white">
                Posting Schedule
              </h2>
              <p className="text-xs text-zinc-500 mt-0.5">
                Set days and times for automatic video publishing
              </p>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-3 py-2 bg-emerald-500 hover:bg-emerald-600 rounded-lg text-xs font-medium text-white transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Schedule
            </button>
          </div>

          {/* Add form */}
          <AnimatePresence>
            {showForm && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden border-b border-zinc-800/50"
              >
                <div className="p-4 bg-zinc-800/20 flex flex-col sm:flex-row items-start sm:items-end gap-4">
                  <div className="w-full sm:w-48">
                    <label className="block text-xs text-zinc-500 mb-1.5">
                      Day of Week
                    </label>
                    <select
                      value={newDay}
                      onChange={(e) => setNewDay(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
                    >
                      {DAY_NAMES.map((name, i) => (
                        <option key={i} value={i}>
                          {name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="w-full sm:w-40">
                    <label className="block text-xs text-zinc-500 mb-1.5">
                      Time (UTC)
                    </label>
                    <Input
                      type="time"
                      value={newTime}
                      onChange={(e) => setNewTime(e.target.value)}
                      className="bg-zinc-800 border-zinc-700 text-white h-10"
                    />
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <Button
                      size="sm"
                      onClick={handleSave}
                      disabled={saving}
                      className="flex-1 sm:flex-none"
                    >
                      {saving ? "Saving..." : "Create"}
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setShowForm(false)}
                      className="flex-1 sm:flex-none"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Schedule list */}
          {isLoading ? (
            <div className="p-12 text-center">
              <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-xs text-zinc-500">Loading schedules...</p>
            </div>
          ) : schedules.length === 0 && !showForm ? (
            <div className="p-12 text-center">
              <Calendar className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
              <p className="text-sm text-zinc-400 font-medium">
                No schedules yet
              </p>
              <p className="text-xs text-zinc-600 mt-1">
                Add a schedule to auto-publish videos on specific days.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-800/50">
              {schedules.map((schedule) => {
                const DayIcon = DAY_ICONS[schedule.day_of_week];
                return (
                  <div
                    key={schedule.id}
                    className="flex items-center justify-between px-5 py-4 hover:bg-zinc-800/20 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center ${schedule.enabled ? "bg-emerald-500/20" : "bg-zinc-800"}`}
                      >
                        <DayIcon
                          className={`w-5 h-5 ${schedule.enabled ? "text-emerald-400" : "text-zinc-500"}`}
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-white">
                            {DAY_NAMES[schedule.day_of_week]}
                          </p>
                          <span className="px-2 py-0.5 rounded text-xs font-mono bg-zinc-800 text-zinc-300">
                            {formatTime(schedule.time_utc)}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider ${
                              schedule.enabled
                                ? "bg-emerald-500/15 text-emerald-400"
                                : "bg-zinc-700 text-zinc-500"
                            }`}
                          >
                            {schedule.enabled ? "Active" : "Paused"}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-500 mt-1 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Last run: {timeAgo(schedule.last_run_at)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggle(schedule)}
                        className={`relative w-10 h-5 rounded-full transition-colors ${
                          schedule.enabled ? "bg-emerald-500" : "bg-zinc-700"
                        }`}
                        title={schedule.enabled ? "Pause" : "Activate"}
                      >
                        <div
                          className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                            schedule.enabled
                              ? "translate-x-5"
                              : "translate-x-0.5"
                          }`}
                        />
                      </button>
                      <button
                        onClick={() => handleDelete(schedule.id)}
                        className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
                        title="Delete schedule"
                      >
                        <Trash2 className="w-4 h-4 text-zinc-500 hover:text-rose-400" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* External cron info */}
        <div className="mt-6 p-4 rounded-xl bg-zinc-900/30 border border-zinc-800/50">
          <p className="text-xs text-zinc-500 flex items-start gap-2">
            <AlertTriangle className="w-3.5 h-3.5 text-zinc-600 mt-0.5 shrink-0" />
            <span>
              Schedules are checked by an external cron service every 15
              minutes. Your video will be published within ±10 minutes of the
              scheduled time.
            </span>
          </p>
        </div>
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-emerald-500 text-white px-5 py-3 rounded-lg text-sm font-medium shadow-xl"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              {toast}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
