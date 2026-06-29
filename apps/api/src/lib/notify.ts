import { env } from "./env";

interface DiscordEmbed {
    title: string;
    description?: string;
    color?: number;
    fields?: { name: string; value: string; inline?: boolean }[];
    timestamp?: string;
}

export const notifyDiscord = (embed: DiscordEmbed): void => {
  const url = env.DISCORD_WEBHOOK_URL;
  if (!url) {
    console.warn("⚠️ DISCORD_WEBHOOK_URL is not set. Skipping notification.");
    return;
  }

  void fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      embeds: [embed],
    }),
  }).catch((error) => {
    console.error("[notify] Discord webhook error:", error);
  });
};
