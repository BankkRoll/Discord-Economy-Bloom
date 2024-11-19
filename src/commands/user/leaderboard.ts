import { ApplicationCommandRegistry, Command } from "@sapphire/framework";

import { ChatInputCommandInteraction } from "discord.js";
import { UserData } from "../../database/enmap";
import { createEmbed } from "../../utils/embed";

export default class LeaderboardCommand extends Command {
  constructor(context: Command.Context, options: Command.Options) {
    super(context, {
      ...options,
      name: "leaderboard",
      description: "View the top users with the highest balances.",
    });
  }

  registerApplicationCommands(registry: ApplicationCommandRegistry) {
    registry.registerChatInputCommand((builder) =>
      builder.setName(this.name).setDescription(this.description),
    );
  }

  async chatInputRun(interaction: ChatInputCommandInteraction) {
    const allUsers = UserData.fetchEverything();
    const leaderboard = allUsers
      .map((data, id) => ({ id, balance: data.balance || 0 }))
      .sort((a, b) => b.balance - a.balance)
      .slice(0, 10);

    if (leaderboard.length === 0) {
      return interaction.reply({ content: "The leaderboard is currently empty!", ephemeral: true });
    }

    const leaderboardList = leaderboard
      .map(
        (entry, index) =>
          `**#${index + 1}** - <@${entry.id}>: \`${entry.balance} coins\``,
      )
      .join("\n");

    const embed = createEmbed({
      title: "Leaderboard",
      description: leaderboardList,
      color: 0xffd700,
    });

    return interaction.reply({ embeds: [embed] });
  }
}
