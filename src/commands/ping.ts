// src/commands/ping.ts

import { ApplicationCommandRegistry, Command } from "@sapphire/framework";

import { ChatInputCommandInteraction } from "discord.js";
import { createEmbed } from "../utils/embed.js";

export default class PingCommand extends Command {
  constructor(context: Command.Context, options: Command.Options) {
    super(context, {
      ...options,
      name: "ping",
      description: "🏓 Check the bot's latency",
    });
  }

  registerApplicationCommands(registry: ApplicationCommandRegistry) {
    registry.registerChatInputCommand((builder) =>
      builder.setName(this.name).setDescription(this.description),
    );
  }

  async chatInputRun(interaction: ChatInputCommandInteraction) {
    const sent = await interaction.reply({
      content: "🏓 Pinging...",
      fetchReply: true,
      ephemeral: true,
    });

    const timeDiff = sent.createdTimestamp - interaction.createdTimestamp;
    const apiLatency = Math.round(interaction.client.ws.ping);

    const embed = createEmbed({
      title: "Pong! 🏓",
      description: `📡 **Latency:** \`${timeDiff}ms\`\n🌐 **API Latency:** \`${apiLatency}ms\``,
      color: 0x22c55e,
      timestamp: new Date(),
    });

    await interaction.editReply({ content: null, embeds: [embed] });
  }
}
