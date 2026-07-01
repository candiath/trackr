import { env } from './env';

/**
 * The subset of the Discord embed shape we use. Discord ignores any key outside its
 * schema, so client data (IP, user-agent, …) must go inside `fields`, not as extra
 * top-level keys.
 */
interface DiscordEmbed {
  title: string;
  description?: string;
  color?: number;
  fields?: { name: string; value: string; inline?: boolean }[];
  timestamp?: string;
}

/**
 * Sends an embed to the Discord webhook. Fire-and-forget: it never blocks the caller
 * and never throws into it, so a slow or down Discord can't affect the login flow. A
 * missing webhook URL (the env var is optional) is a silent no-op.
 */
export const notifyDiscord = (embed: DiscordEmbed): void => {
  const url = env.DISCORD_WEBHOOK_URL;
  if (!url) return;

  void fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ embeds: [embed] }),
  }).catch((error) => console.error('[notify] Discord webhook error:', error));
};
