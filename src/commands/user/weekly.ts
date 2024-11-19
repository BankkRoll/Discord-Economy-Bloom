import { ApplicationCommandRegistry, Command } from "@sapphire/framework";
import { ServerSettings, UserData } from "../../database/enmap";

import { ChatInputCommandInteraction } from "discord.js";
import { createEmbed } from "../../utils/embed";
import { logAction } from "../../listeners/events";

export default class WeeklyCommand extends Command {
  constructor(context: Command.Context, options: Command.Options) {
    super(context, {
      ...options,
      name: "weekly",
      description: "Claim your weekly reward.",
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
    const weeklyReward = serverSettings?.weeklyReward || 500;

    const lastClaimed = new Date(userData.cooldowns.weekly || 0);
    const now = new Date();
    const cooldown = 7 * 24 * 60 * 60 * 1000;
    const nextClaimTime = lastClaimed.getTime() + cooldown;

    if (now.getTime() < nextClaimTime) {
      await interaction.reply({
        content: `❌ You've already claimed your weekly reward. You can claim it again <t:${Math.floor(nextClaimTime / 1000)}:R>.`,
        ephemeral: true,
      });
      return;
    }

    userData.balance += weeklyReward;
    userData.cooldowns.weekly = now.toISOString();
    UserData.set(user.id, userData);

    const embed = createEmbed({
      title: "Weekly Reward Claimed",
      description: `🎉 You've received \`${weeklyReward} coins\`!`,
      fields: [
        { name: "Reward", value: `${weeklyReward} coins`, inline: true },
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
        action: "weekly",
        amount: weeklyReward,
        description: `User claimed weekly reward of ${weeklyReward} coins.`,
      },
      interaction.client
    );
  }
}