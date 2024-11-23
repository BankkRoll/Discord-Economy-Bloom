import { ApplicationCommandRegistry, Command } from "@sapphire/framework";

import { ChatInputCommandInteraction } from "discord.js";
import { LeaderboardData } from "../../database/enmap.js";
import { createEmbed } from "../../utils/embed.js";
import { logAction } from "../../utils/events.js";
import { hasAdminOrRolePermission } from "../../utils/permissions.js";

export default class ResetLeaderboardCommand extends Command {
  constructor(context: Command.Context, options: Command.Options) {
    super(context, {
      ...options,
      name: "resetleaderboard",
      description: "Reset the leaderboard data.",
    });
  }

  registerApplicationCommands(registry: ApplicationCommandRegistry) {
    registry.registerChatInputCommand((builder) =>
      builder.setName(this.name).setDescription(this.description),
    );
  }

  async chatInputRun(interaction: ChatInputCommandInteraction) {
    const member = interaction.guild?.members.cache.get(interaction.user.id);
    if (!hasAdminOrRolePermission(member, interaction.guildId)) {
      await interaction.reply({
        content: `❌ You do not have permission to use this command.`,
        ephemeral: true,
      });
      return;
    }

    // Reset Leaderboard
    LeaderboardData.clear();

    // Create Embed for Interaction Reply
    const embed = createEmbed({
      title: "Leaderboard Reset",
      description: "The leaderboard has been cleared.",
      color: 0xe74c3c,
      timestamp: new Date(),
    });

    await interaction.reply({ embeds: [embed] });

    // Log the Action
    await logAction(
      interaction.guildId || "",
      {
        action: "resetleaderboard",
        admin: interaction.user.id,
        description: "Admin reset the leaderboard.",
      },
      interaction.client,
    );

    return;
  }
}
