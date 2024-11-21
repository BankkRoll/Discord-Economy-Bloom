// src\listeners\events.ts

import { Client, TextChannel } from "discord.js";
import { LogsData, ServerSettings } from "../database/enmap";

import { createEmbed } from "../utils/embed";

/**
 * Logs an action to Enmap and optionally sends an embed to the logs channel.
 *
 * @param guildId - The ID of the guild where the action occurred.
 * @param actionDetails - Details of the action being logged.
 * @param client - The Discord client instance.
 */
export async function logAction(
  guildId: string,
  actionDetails: {
    user?: string | null; 
    action: string;
    amount?: number;
    admin?: string | null;
    target?: string | null;
    item?: string | null;
    description?: string;
  },
  client: Client,
): Promise<void> {
  // Save the log to Enmap
  LogsData.set(Date.now().toString(), {
    user: actionDetails.user,
    action: actionDetails.action,
    amount: actionDetails.amount || 0,
    timestamp: new Date().toISOString(),
    admin: actionDetails.admin || null,
    target: actionDetails.target || null,
    item: actionDetails.item || null,
    description: actionDetails.description || "",
  });

  // Retrieve log channel from ServerSettings
  const serverSettings = ServerSettings.get(guildId);
  const logChannelId = serverSettings?.logChannel;

  if (!logChannelId) return;

  const logChannel = client.channels.cache.get(logChannelId) as TextChannel;
  if (!logChannel) return;

  // Create the embed with fields
  const fields = [
    { name: "Action", value: actionDetails.action, inline: true },
    {
      name: "User",
      value: actionDetails.user ? `<@${actionDetails.user}>` : "N/A",
      inline: true,
    },
  ];

  if (actionDetails.target) {
    fields.push({
      name: "Target",
      value: `<@${actionDetails.target}>`,
      inline: true,
    });
  }

  if (actionDetails.amount) {
    fields.push({
      name: "Amount",
      value: `${actionDetails.amount}`,
      inline: true,
    });
  }

  if (actionDetails.item) {
    fields.push({
      name: "Item",
      value: actionDetails.item,
      inline: true,
    });
  }

  if (actionDetails.admin) {
    fields.push({
      name: "Admin",
      value: `<@${actionDetails.admin}>`,
      inline: true,
    });
  }

  if (actionDetails.description) {
    fields.push({
      name: "Details",
      value: actionDetails.description,
      inline: false,
    });
  }

  // Create the embed
  const embed = createEmbed({
    title: "Action Logged",
    color: 0x1e90ff,
    timestamp: new Date(),
    fields,
  });

  // Send the embed to the logs channel
  await logChannel.send({ embeds: [embed] });
}
