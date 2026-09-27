const DISCORD_API_BASE = "https://discord.com/api/v10";

export type DiscordTicketSnapshot = {
  channelId: string;
  channelName: string;
  customerName: string | null;
  customerId: string | null;
  productName: string | null;
  hasLitecoinEmbed: boolean;
};

type DiscordChannel = {
  id: string;
  name?: string;
  type?: number;
};

type DiscordEmbed = {
  title?: string;
  description?: string;
  fields?: Array<{ name?: string; value?: string }>;
};

type DiscordMessage = {
  author?: { id?: string; username?: string; global_name?: string };
  embeds?: DiscordEmbed[];
};

export function isDiscordConfigured(): boolean {
  return Boolean(
    process.env.DISCORD_BOT_TOKEN &&
      (process.env.DISCORD_TICKET_CHANNEL_IDS || process.env.DISCORD_GUILD_ID),
  );
}

function getHeaders() {
  const token = process.env.DISCORD_BOT_TOKEN;
  if (!token) throw new Error("DISCORD_BOT_TOKEN is required");
  return {
    Authorization: `Bot ${token}`,
    "User-Agent": "SicarioShopBot/1.0",
  };
}

async function discordFetch<T>(path: string): Promise<T> {
  const response = await fetch(`${DISCORD_API_BASE}${path}`, {
    headers: getHeaders(),
    signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok) {
    throw new Error(`Discord responded with HTTP ${response.status}`);
  }
  return (await response.json()) as T;
}

function textFromEmbed(embed: DiscordEmbed): string {
  return [
    embed.title,
    embed.description,
    ...(embed.fields ?? []).flatMap((field) => [field.name, field.value]),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

export async function fetchDiscordTicketSnapshots(): Promise<DiscordTicketSnapshot[]> {
  const configuredIds = (process.env.DISCORD_TICKET_CHANNEL_IDS ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
  let channels: DiscordChannel[] = configuredIds.map((id) => ({
    id,
    name: `ticket-${id.slice(-4)}`,
    type: 0,
  }));

  if (channels.length === 0 && process.env.DISCORD_GUILD_ID) {
    channels = await discordFetch<DiscordChannel[]>(
      `/guilds/${process.env.DISCORD_GUILD_ID}/channels`,
    );
    channels = channels.filter((channel) => channel.type === 0 || channel.type === 5);
  }

  const snapshots: DiscordTicketSnapshot[] = [];
  for (const channel of channels) {
    const messages = await discordFetch<DiscordMessage[]>(
      `/channels/${channel.id}/messages?limit=25`,
    );
    const embeds = messages.flatMap((message) => message.embeds ?? []);
    const ltcEmbed = embeds.find((embed) => /\b(?:ltc|litecoin)\b/i.test(textFromEmbed(embed)));
    const latest = messages[0];
    const productName =
      ltcEmbed?.fields?.find((field) => /product|produit|item/i.test(field.name ?? ""))
        ?.value ?? null;

    snapshots.push({
      channelId: channel.id,
      channelName: channel.name ?? channel.id,
      customerName: latest?.author?.global_name ?? latest?.author?.username ?? null,
      customerId: latest?.author?.id ?? null,
      productName,
      hasLitecoinEmbed: Boolean(ltcEmbed),
    });
  }

  return snapshots;
}

export async function sendDiscordMessage(
  channelId: string,
  content: string,
): Promise<void> {
  const response = await fetch(`${DISCORD_API_BASE}/channels/${channelId}/messages`, {
    method: "POST",
    headers: {
      ...getHeaders(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ content }),
    signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok) {
    throw new Error(`Discord message failed with HTTP ${response.status}`);
  }
}