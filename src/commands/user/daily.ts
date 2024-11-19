import { ApplicationCommandRegistry, Command } from "@sapphire/framework";
import { ServerSettings, UserData } from "../../database/enmap";

import { ChatInputCommandInteraction } from "discord.js";
import { createEmbed } from "../../utils/embed";
import { logAction } from "../../listeners/events";

export default class DailyCommand extends Command {
  constructor(context: Command.Context, options: Command.Options) {
    super(context, {
      ...options,
      name: "daily",
      description: "Claim your daily reward.",
    });
  }

  registerApplicationCommands(registry: ApplicationCommandRegistry) {
    registry.registerChatInputCommand((builder) =>
      builder.setName(this.name).setDescription(this.description)
    );
  }

  async chatInputRun(interaction: ChatInputCommandInteraction) {
    const user = interaction.user;
    const userData = UserData.ensure(user.id, { balance: 0, cooldowns: {} });
    const serverSettings = ServerSettings.get(interaction.guildId || "");
    const dailyReward = serverSettings?.dailyReward || 100;

    const lastClaimed = new Date(userData.cooldowns.daily || 0);
    const now = new Date();
    const cooldown = 24 * 60 * 60 * 1000;
    const nextClaimTime = lastClaimed.getTime() + cooldown;

    if (now.getTime() < nextClaimTime) {
      await interaction.reply({
        content: `❌ You've already claimed your daily reward. You can claim it again <t:${Math.floor(nextClaimTime / 1000)}:R>.`,
        ephemeral: true,
      });
      return;
    }

    userData.balance += dailyReward;
    userData.cooldowns.daily = now.toISOString();
    UserData.set(user.id, userData);

    const embed = createEmbed({
      title: "Daily Reward Claimed",
      description: `🎉 You've received \`${dailyReward} coins\`!`,
      fields: [
        { name: "Reward", value: `${dailyReward} coins`, inline: true },
        { name: "New Balance", value: `${userData.balance} coins`, inline: true },
      ],
      color: 0x22c55e,
      timestamp: new Date(),
    });

    await interaction.reply({ embeds: [embed] });

    await logAction(
      interaction.guildId || "",
      {
        user: user.id,
        action: "daily",
        amount: dailyReward,
        description: `User claimed daily reward of ${dailyReward} coins.`,
      },
      interaction.client
    );
  }
}