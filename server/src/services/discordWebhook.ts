type AlertType = "failure" | "success" | "warning";

const EMBED_COLORS: Record<AlertType, number> = {
  failure: 0xe11d48, // rose-600
  success: 0x10b981, // emerald-500
  warning: 0xf59e0b, // amber-500
};

const ALERT_ICONS: Record<AlertType, string> = {
  failure: "❌",
  success: "✅",
  warning: "⚠️",
};

/**
 * Send a Discord embed alert to the user's configured webhook.
 * Silently ignores missing/invalid webhook URLs.
 */
export const sendDiscordAlert = async (
  webhookUrl: string | null | undefined,
  payload: {
    title: string;
    message: string;
    type?: AlertType;
    stage?: string;
    jobId?: string;
    fields?: { name: string; value: string; inline?: boolean }[];
  },
): Promise<void> => {
  if (!webhookUrl) return;

  const type = payload.type || "failure";
  const icon =
    payload.type === "success" ? ALERT_ICONS.success : ALERT_ICONS[type];

  const embed: any = {
    title: `${icon} ${payload.title}`,
    color: EMBED_COLORS[type],
    description: payload.message.slice(0, 2000),
    fields: [...(payload.fields || [])],
    timestamp: new Date().toISOString(),
    footer: { text: "Commissioner" },
  };

  if (payload.stage) {
    embed.fields.push({ name: "Stage", value: payload.stage, inline: true });
  }
  if (payload.jobId) {
    embed.fields.push({
      name: "Job ID",
      value: `\`${payload.jobId.slice(0, 8)}\``,
      inline: true,
    });
  }

  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "Commissioner",
        embeds: [embed],
      }),
    });

    if (!res.ok) {
      console.warn(`[Discord] Webhook returned ${res.status}`);
    }
  } catch (err) {
    console.warn("[Discord] Failed to send webhook:", err);
  }
};

/**
 * Fetch the user's Discord webhook URL from the database.
 */
export const getUserWebhookUrl = async (
  supabase: any,
  userId: string,
): Promise<string | null> => {
  try {
    const { data, error } = await supabase
      .from("user_usage")
      .select("discord_webhook_url")
      .eq("user_id", userId)
      .maybeSingle();

    if (error || !data?.discord_webhook_url) return null;
    return data.discord_webhook_url;
  } catch {
    return null;
  }
};
