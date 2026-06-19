import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  CreditCard,
  Settings as SettingsIcon,
  Lock,
  Check,
  AlertCircle,
  Save,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dropdown } from "@/components/ui/dropdown";

const settingsSections = [
  {
    id: "general",
    name: "General",
    icon: SettingsIcon,
    description: "App preferences",
  },
  {
    id: "notifications",
    name: "Notifications",
    icon: Bell,
    description: "Email, push and Discord alerts",
  },
  {
    id: "billing",
    name: "Billing",
    icon: CreditCard,
    description: "Subscription and payments",
  },
];

// Toast notification component
function Toast({
  message,
  type,
  onClose,
}: {
  message: string;
  type: "success" | "error";
  onClose: () => void;
}) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 50 }}
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg ${
        type === "success"
          ? "bg-emerald-500 text-white"
          : "bg-red-500 text-white"
      }`}
    >
      {type === "success" ? (
        <Check className="w-5 h-5" />
      ) : (
        <AlertCircle className="w-5 h-5" />
      )}
      <span className="text-sm font-medium">{message}</span>
    </motion.div>
  );
}

function ComingSoonOverlay() {
  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-zinc-950/60 backdrop-blur-sm rounded-xl">
      <Lock className="w-10 h-10 text-zinc-600 mb-3" />
      <p className="text-base font-semibold text-zinc-400">Coming Soon</p>
      <p className="text-xs text-zinc-600 mt-1">
        This feature is not yet available
      </p>
    </div>
  );
}

export function Settings() {
  const [searchParams] = useSearchParams();
  const urlSection = searchParams.get("section");
  const [activeSection, setActiveSection] = useState(urlSection || "general");
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Update active section when URL changes
  useEffect(() => {
    const section = searchParams.get("section");
    if (section && ["general", "notifications", "billing"].includes(section)) {
      setActiveSection(section);
    }
  }, [searchParams]);

  // General/Video Settings
  const [videoSettings, setVideoSettings] = useState({
    privacy: "public" as "public" | "private" | "unlisted",
    category: "Education",
    language: "English",
    allowComments: true,
  });

  // General/Security
  const [securitySettings, setSecuritySettings] = useState({
    autoSave: true,
    confirmBeforePublish: true,
  });

  // Notifications
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    videoPublished: true,
    accountIssues: true,
    weeklyReports: false,
  });
  const [discordWebhook, setDiscordWebhook] = useState("");

  // Dropdown options
  const privacyOptions = [
    { value: "public", label: "Public" },
    { value: "unlisted", label: "Unlisted" },
    { value: "private", label: "Private" },
  ];

  const categoryOptions = [
    { value: "Education", label: "Education" },
    { value: "Entertainment", label: "Entertainment" },
    { value: "Gaming", label: "Gaming" },
    { value: "Music", label: "Music" },
    { value: "Technology", label: "Technology" },
    { value: "Howto & Style", label: "Howto & Style" },
    { value: "Science & Tech", label: "Science & Tech" },
  ];

  const languageOptions = [
    { value: "English", label: "English" },
    { value: "Spanish", label: "Spanish" },
    { value: "French", label: "French" },
    { value: "German", label: "German" },
    { value: "Portuguese", label: "Portuguese" },
    { value: "Italian", label: "Italian" },
    { value: "Japanese", label: "Japanese" },
    { value: "Korean", label: "Korean" },
  ];

  // Load settings from API on mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setIsLoading(true);
        const res = await fetch("/api/settings", { credentials: "include" });
        if (!res.ok) throw new Error("Failed to load settings");
        const data = await res.json();
        const s = data.settings;

        if (s.video_settings) setVideoSettings(s.video_settings);
        if (s.security_settings) setSecuritySettings(s.security_settings);
        if (s.notification_settings) setNotifications(s.notification_settings);
        if (s.discord_webhook_url) setDiscordWebhook(s.discord_webhook_url);
      } catch (err) {
        console.error("Failed to fetch settings:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const showToast = (
    message: string,
    type: "success" | "error" = "success",
  ) => {
    setToast({ message, type });
  };

  const saveToApi = async (body: Record<string, any>) => {
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to save");
      return true;
    } catch (err) {
      console.error("Save error:", err);
      showToast("Failed to save settings", "error");
      return false;
    }
  };

  const saveVideoSettings = async () => {
    const ok = await saveToApi({
      video_settings: videoSettings,
      security_settings: securitySettings,
    });
    if (ok) showToast("Video settings saved!");
  };

  const saveNotificationSettings = async () => {
    const ok = await saveToApi({
      notification_settings: notifications,
      discord_webhook_url: discordWebhook || null,
    });
    if (ok) showToast("Notification preferences saved!");
  };

  return (
    <div className="pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Settings</h1>
          <p className="text-zinc-400 mt-1">
            Configure your account preferences
          </p>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <nav className="space-y-2">
              {settingsSections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-colors ${
                    activeSection === section.id
                      ? "bg-zinc-800 text-white"
                      : "text-zinc-400 hover:bg-zinc-800/50 hover:text-white"
                  }`}
                >
                  <section.icon className="w-5 h-5" />
                  <div>
                    <span className="text-sm font-medium">{section.name}</span>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      {section.description}
                    </p>
                  </div>
                </button>
              ))}
            </nav>
          </div>

          <div className="lg:col-span-3">
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-8 h-8 border-2 border-[#10b981] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <>
                {activeSection === "general" && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                  >
                    {/* API Keys - Coming Soon */}
                    <Card hover={false} className="relative overflow-hidden">
                      <ComingSoonOverlay />
                      <CardHeader>
                        <CardTitle>API Keys</CardTitle>
                        <CardDescription>
                          Your API credentials for external integrations
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6 opacity-30 pointer-events-none">
                        <div>
                          <label className="block text-sm font-medium text-zinc-300 mb-2">
                            API Key
                          </label>
                          <Input placeholder="••••••••••••••••" disabled />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-zinc-300 mb-2">
                            YouTube API Key
                          </label>
                          <Input
                            placeholder="Enter your YouTube Data API key"
                            disabled
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-zinc-300 mb-2">
                            OpenAI API Key
                          </label>
                          <Input
                            type="password"
                            placeholder="Enter your OpenAI API key"
                            disabled
                          />
                        </div>
                      </CardContent>
                    </Card>

                    {/* Default Video Settings */}
                    <Card hover={false}>
                      <CardHeader>
                        <CardTitle>Default Video Settings</CardTitle>
                        <CardDescription>
                          Default options for new video uploads
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div>
                          <label className="block text-sm font-medium text-zinc-300 mb-2">
                            Privacy
                          </label>
                          <Dropdown
                            options={privacyOptions}
                            value={videoSettings.privacy}
                            onChange={(value) =>
                              setVideoSettings((prev) => ({
                                ...prev,
                                privacy: value as any,
                              }))
                            }
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-zinc-300 mb-2">
                            Category
                          </label>
                          <Dropdown
                            options={categoryOptions}
                            value={videoSettings.category}
                            onChange={(value) =>
                              setVideoSettings((prev) => ({
                                ...prev,
                                category: value,
                              }))
                            }
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-zinc-300 mb-2">
                            Language
                          </label>
                          <Dropdown
                            options={languageOptions}
                            value={videoSettings.language}
                            onChange={(value) =>
                              setVideoSettings((prev) => ({
                                ...prev,
                                language: value,
                              }))
                            }
                          />
                        </div>
                        <div className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-xl">
                          <div>
                            <p className="text-sm font-medium text-white">
                              Allow Comments
                            </p>
                            <p className="text-xs text-zinc-400">
                              Enable comments on new videos by default
                            </p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={videoSettings.allowComments}
                              onChange={(e) =>
                                setVideoSettings((prev) => ({
                                  ...prev,
                                  allowComments: e.target.checked,
                                }))
                              }
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                          </label>
                        </div>
                        <Button onClick={saveVideoSettings}>
                          <Save className="w-4 h-4 mr-2" /> Save Video Settings
                        </Button>
                      </CardContent>
                    </Card>

                    {/* Security */}
                    <Card hover={false}>
                      <CardHeader>
                        <CardTitle>Security Settings</CardTitle>
                        <CardDescription>
                          Manage your account security preferences
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-xl">
                          <div>
                            <p className="text-sm font-medium text-white">
                              Auto-save drafts
                            </p>
                            <p className="text-xs text-zinc-400">
                              Automatically save video drafts while editing
                            </p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={securitySettings.autoSave}
                              onChange={(e) =>
                                setSecuritySettings((prev) => ({
                                  ...prev,
                                  autoSave: e.target.checked,
                                }))
                              }
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                          </label>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-xl">
                          <div>
                            <p className="text-sm font-medium text-white">
                              Confirm before publish
                            </p>
                            <p className="text-xs text-zinc-400">
                              Show confirmation dialog before publishing videos
                            </p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={securitySettings.confirmBeforePublish}
                              onChange={(e) =>
                                setSecuritySettings((prev) => ({
                                  ...prev,
                                  confirmBeforePublish: e.target.checked,
                                }))
                              }
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                          </label>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}

                {activeSection === "notifications" && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                  >
                    <Card hover={false}>
                      <CardHeader>
                        <CardTitle>Notification Preferences</CardTitle>
                        <CardDescription>
                          Choose what notifications you receive
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {[
                          {
                            label: "Email Notifications",
                            desc: "Receive updates via email",
                            key: "email" as const,
                          },
                          {
                            label: "Push Notifications",
                            desc: "Browser push notifications",
                            key: "push" as const,
                          },
                          {
                            label: "Video Published",
                            desc: "Get notified when videos go live",
                            key: "videoPublished" as const,
                          },
                          {
                            label: "Account Issues",
                            desc: "Alerts about account problems",
                            key: "accountIssues" as const,
                          },
                          {
                            label: "Weekly Reports",
                            desc: "Performance summary every Monday",
                            key: "weeklyReports" as const,
                          },
                        ].map((item) => (
                          <div
                            key={item.label}
                            className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-xl"
                          >
                            <div>
                              <p className="text-sm font-medium text-white">
                                {item.label}
                              </p>
                              <p className="text-xs text-zinc-400">
                                {item.desc}
                              </p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={notifications[item.key]}
                                onChange={(e) =>
                                  setNotifications((prev) => ({
                                    ...prev,
                                    [item.key]: e.target.checked,
                                  }))
                                }
                                className="sr-only peer"
                              />
                              <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                            </label>
                          </div>
                        ))}
                        <Button onClick={saveNotificationSettings}>
                          <Save className="w-4 h-4 mr-2" /> Save Preferences
                        </Button>
                      </CardContent>
                    </Card>

                    {/* Discord Webhook */}
                    <Card hover={false}>
                      <CardHeader>
                        <CardTitle>Discord Alerts</CardTitle>
                        <CardDescription>
                          Get notified in Discord when things go wrong
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-zinc-300 mb-2">
                            Discord Webhook URL
                          </label>
                          <Input
                            placeholder="https://discord.com/api/webhooks/..."
                            value={discordWebhook}
                            onChange={(e) => setDiscordWebhook(e.target.value)}
                            className="bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600"
                          />
                          <ul className="mt-3 space-y-1.5">
                            <li className="flex items-start gap-2 text-xs text-zinc-500">
                              <div className="w-1 h-1 rounded-full bg-zinc-600 mt-1.5 shrink-0" />
                              <span>
                                You'll be alerted when a video automation fails
                              </span>
                            </li>
                            <li className="flex items-start gap-2 text-xs text-zinc-500">
                              <div className="w-1 h-1 rounded-full bg-zinc-600 mt-1.5 shrink-0" />
                              <span>
                                Get notified when a video fails to post
                              </span>
                            </li>
                            <li className="flex items-start gap-2 text-xs text-zinc-500">
                              <div className="w-1 h-1 rounded-full bg-zinc-600 mt-1.5 shrink-0" />
                              <span>
                                Set up a webhook in your Discord server channel
                                settings
                              </span>
                            </li>
                          </ul>
                        </div>
                        <Button onClick={saveNotificationSettings}>
                          <Save className="w-4 h-4 mr-2" /> Save Discord Webhook
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}

                {activeSection === "billing" && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <Card hover={false} className="relative overflow-hidden">
                      <ComingSoonOverlay />
                      <CardHeader>
                        <CardTitle>Billing</CardTitle>
                        <CardDescription>
                          Subscription and payment details
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="opacity-30 pointer-events-none">
                        <div className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-xl mb-4">
                          <div>
                            <p className="text-lg font-semibold text-white">
                              Pro Plan
                            </p>
                            <p className="text-sm text-zinc-400">$149/month</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Toast Notifications */}
      <AnimatePresence>
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
