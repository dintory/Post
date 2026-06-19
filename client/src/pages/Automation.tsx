import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  Clock,
  Plus,
  Play,
  Trash2,
  CheckCircle2,
  Hash,
  Repeat,
  CalendarDays,
  Bell,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dropdown } from "@/components/ui/dropdown";
import { cachedFetch, invalidateCache } from "@/lib/cache";

interface Schedule {
  id: string;
  schedule_type: "weekly" | "daily" | "interval" | "monthly";
  day_of_week: number;
  time_utc: string;
  interval_hours: number;
  month_day: number;
  enabled: boolean;
  label: string;
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

const SCHEDULE_TYPES = [
  { value: "weekly", label: "Weekly" },
  { value: "daily", label: "Daily" },
  { value: "interval", label: "Every N Hours" },
  { value: "monthly", label: "Monthly" },
] as const;

const CONTENT_TYPES = [
  { value: "Reddit Short", label: "Reddit Short" },
  { value: "POV Short", label: "POV Short" },
  { value: "Trending Clip", label: "Trending Clip" },
  { value: "AI Voiceover", label: "AI Voiceover" },
];

function formatTime(timeUtc: string): string {
  if (!timeUtc) return "--:--";
  const [h, m] = timeUtc.split(":").map(Number);
  const now = new Date();
  const local = new Date(
    Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), h, m),
  );
  const hh = local.getHours();
  const mm = local.getMinutes();
  const period = hh >= 12 ? "PM" : "AM";
  const hour = hh % 12 || 12;
  return `${hour}:${String(mm).padStart(2, "0")} ${period}`;
}

function localToUtc(timeLocal: string): string {
  const [h, m] = timeLocal.split(":").map(Number);
  const now = new Date();
  const local = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    h,
    m,
  );
  return `${String(local.getUTCHours()).padStart(2, "0")}:${String(local.getUTCMinutes()).padStart(2, "0")}`;
}

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return "Never";
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function scheduleDescription(schedule: Schedule): string {
  switch (schedule.schedule_type || "weekly") {
    case "weekly":
      return `${DAY_NAMES[schedule.day_of_week]} at ${formatTime(schedule.time_utc)}`;
    case "daily":
      return `Every day at ${formatTime(schedule.time_utc)}`;
    case "interval":
      return `Every ${schedule.interval_hours} hour${schedule.interval_hours > 1 ? "s" : ""}`;
    case "monthly":
      return `Day ${schedule.month_day} at ${formatTime(schedule.time_utc)}`;
    default:
      return "";
  }
}

function scheduleTypeIcon(type: string) {
  switch (type) {
    case "weekly":
      return Calendar;
    case "daily":
      return Bell;
    case "interval":
      return Repeat;
    case "monthly":
      return CalendarDays;
    default:
      return Calendar;
  }
}

export function Automation() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [scheduleType, setScheduleType] = useState<string>("weekly");
  const [newDay, setNewDay] = useState(1);
  const [newTime, setNewTime] = useState("09:00");
  const [newInterval, setNewInterval] = useState(6);
  const [newMonthDay, setNewMonthDay] = useState(1);
  const [newLabel, setNewLabel] = useState("Reddit Short");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }, []);

  const fetchSchedules = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await cachedFetch("/api/automation/schedules", {
        ttl: 10000,
      });
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
      const body: Record<string, any> = {
        schedule_type: scheduleType,
        enabled: true,
        label: newLabel,
      };

      if (scheduleType === "weekly") {
        body.day_of_week = newDay;
        body.time_utc = localToUtc(newTime);
      } else if (scheduleType === "daily") {
        body.time_utc = localToUtc(newTime);
      } else if (scheduleType === "interval") {
        body.interval_hours = newInterval;
      } else if (scheduleType === "monthly") {
        body.month_day = newMonthDay;
        body.time_utc = localToUtc(newTime);
      }

      const res = await fetch("/api/automation/schedules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        credentials: "include",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save");
      }
      const data = await res.json();
      invalidateCache("/api/automation/schedules");
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
          schedule_type: schedule.schedule_type,
          day_of_week: schedule.day_of_week,
          time_utc: schedule.time_utc,
          interval_hours: schedule.interval_hours,
          month_day: schedule.month_day,
          enabled: !schedule.enabled,
          label: schedule.label,
        }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update");
      invalidateCache("/api/automation/schedules");
      setSchedules((prev) =>
        prev.map((s) =>
          s.id === schedule.id ? { ...s, enabled: !s.enabled } : s,
        ),
      );
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleTestTrigger = async (id: string) => {
    try {
      const res = await fetch(
        `/api/automation/test-trigger/${id}?secret=yX8FH0C91y`,
        { method: "POST" },
      );
      if (!res.ok) throw new Error("Test trigger failed");
      showToast("🧪 Test webhook sent!");
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
      invalidateCache("/api/automation/schedules");
      setSchedules((prev) => prev.filter((s) => s.id !== id));
      showToast("Schedule deleted.");
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="pt-24 pb-12 min-h-screen bg-[#0A0A0A]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Automation</h1>
            <p className="text-zinc-400 mt-1">
              Schedule content to publish automatically
            </p>
          </div>
        </div>

        <div className="bg-zinc-900/50 rounded-xl border border-zinc-800/50">
          <div className="flex items-center justify-between p-5 border-b border-zinc-800/50">
            <div>
              <h2 className="text-sm font-semibold text-white">
                Posting Schedule
              </h2>
              <p className="text-xs text-zinc-500 mt-0.5">
                Weekly, daily, interval-based, or monthly publishing
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

          <AnimatePresence>
            {showForm && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-visible border-b border-zinc-800/50"
              >
                <div className="p-4 bg-zinc-800/20">
                  <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
                    <div className="w-full sm:w-36">
                      <label className="block text-xs text-zinc-500 mb-1.5">
                        Type
                      </label>
                      <Dropdown
                        options={SCHEDULE_TYPES.map((t) => ({
                          value: t.value,
                          label: t.label,
                        }))}
                        value={scheduleType}
                        onChange={(v) => setScheduleType(v)}
                      />
                    </div>

                    {scheduleType === "weekly" && (
                      <div className="w-full sm:w-36">
                        <label className="block text-xs text-zinc-500 mb-1.5">
                          Day
                        </label>
                        <Dropdown
                          options={DAY_NAMES.map((name, i) => ({
                            value: String(i),
                            label: name,
                          }))}
                          value={String(newDay)}
                          onChange={(v) => setNewDay(Number(v))}
                        />
                      </div>
                    )}

                    {scheduleType === "monthly" && (
                      <div className="w-full sm:w-28">
                        <label className="block text-xs text-zinc-500 mb-1.5">
                          Day of Month
                        </label>
                        <Dropdown
                          options={Array.from({ length: 28 }, (_, i) => ({
                            value: String(i + 1),
                            label: String(i + 1),
                          }))}
                          value={String(newMonthDay)}
                          onChange={(v) => setNewMonthDay(Number(v))}
                        />
                      </div>
                    )}

                    {(scheduleType === "weekly" ||
                      scheduleType === "daily" ||
                      scheduleType === "monthly") && (
                      <div className="w-full sm:w-44">
                        <label className="block text-xs text-zinc-500 mb-1.5">
                          Time
                        </label>
                        <div className="flex gap-1 items-start">
                          <div className="flex-1">
                            <Dropdown
                              options={Array.from({ length: 24 }, (_, i) => ({
                                value: String(i).padStart(2, "0"),
                                label: String(i).padStart(2, "0"),
                              }))}
                              value={newTime.split(":")[0]}
                              onChange={(v) =>
                                setNewTime(`${v}:${newTime.split(":")[1]}`)
                              }
                            />
                          </div>
                          <span className="text-zinc-500 pt-3 text-sm font-medium px-0.5">
                            :
                          </span>
                          <div className="flex-1">
                            <Dropdown
                              options={Array.from({ length: 12 }, (_, i) => ({
                                value: String(i * 5).padStart(2, "0"),
                                label: String(i * 5).padStart(2, "0"),
                              }))}
                              value={newTime.split(":")[1]}
                              onChange={(v) =>
                                setNewTime(`${newTime.split(":")[0]}:${v}`)
                              }
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {scheduleType === "interval" && (
                      <div className="w-full sm:w-36">
                        <label className="block text-xs text-zinc-500 mb-1.5">
                          Every (Hours)
                        </label>
                        <Dropdown
                          options={[2, 3, 4, 6, 8, 12, 24].map((h) => ({
                            value: String(h),
                            label: `${h} hour${h > 1 ? "s" : ""}`,
                          }))}
                          value={String(newInterval)}
                          onChange={(v) => setNewInterval(Number(v))}
                        />
                      </div>
                    )}

                    <div className="w-full sm:w-40">
                      <label className="block text-xs text-zinc-500 mb-1.5">
                        Content
                      </label>
                      <Dropdown
                        options={CONTENT_TYPES}
                        value={newLabel}
                        onChange={(v) => setNewLabel(v)}
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4 justify-end">
                    <Button size="sm" onClick={handleSave} disabled={saving}>
                      {saving ? "Saving..." : "Create"}
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setShowForm(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

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
                Add a schedule to auto-publish content on a recurring basis.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-800/50">
              {schedules.map((schedule) => {
                const TypeIcon = scheduleTypeIcon(
                  schedule.schedule_type || "weekly",
                );
                return (
                  <div
                    key={schedule.id}
                    className="flex items-center justify-between px-5 py-4 hover:bg-zinc-800/20 transition-colors"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${schedule.enabled ? "bg-emerald-500/20" : "bg-zinc-800"}`}
                      >
                        <TypeIcon
                          className={`w-5 h-5 ${schedule.enabled ? "text-emerald-400" : "text-zinc-500"}`}
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-medium text-white">
                            {scheduleDescription(schedule)}
                          </p>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider bg-zinc-800/80 text-zinc-500">
                            {schedule.schedule_type || "weekly"}
                          </span>
                          {schedule.label && (
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-zinc-800 text-zinc-400">
                              <Hash className="w-3 h-3" />
                              {schedule.label}
                            </span>
                          )}
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
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleToggle(schedule)}
                        className={`relative w-10 h-5 rounded-full transition-colors ${schedule.enabled ? "bg-emerald-500" : "bg-zinc-700"}`}
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
                        onClick={() => handleTestTrigger(schedule.id)}
                        className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
                        title="Test Now"
                      >
                        <Play className="w-4 h-4 text-zinc-500 hover:text-emerald-400" />
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

        <div className="mt-6 p-4 rounded-xl bg-zinc-900/30 border border-zinc-800/50">
          <p className="text-xs text-zinc-500 flex items-start gap-2">
            <Play className="w-3.5 h-3.5 text-zinc-600 mt-0.5 shrink-0" />
            <span>
              <strong>Weekly</strong> — pick a day + time.{" "}
              <strong>Daily</strong> — every day at a fixed time.{" "}
              <strong>Every N Hours</strong> — recurring every 2–24h from last
              run. <strong>Monthly</strong> — specific day each month. The cron
              service checks every minute. Click <strong>Play</strong> to test a
              schedule instantly.
            </span>
          </p>
        </div>
      </div>

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
