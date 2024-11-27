import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChatInputCommandInteraction,
  ComponentType,
  EmbedBuilder,
  MessageActionRowComponentBuilder,
} from "discord.js";
import { ApplicationCommandRegistry, Command } from "@sapphire/framework";

import { UserData } from "../../database/enmap.js";

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

  async chatInputRun(interaction: ChatInputCommandInteraction): Promise<void> {
    // Fetch all users from the database
    const allUsers = Array.from(UserData.entries())
      .map(([id, data]) => ({
        id,
        balance: data.balance || 0,
      }))
      .sort((a, b) => b.balance - a.balance);

    if (allUsers.length === 0) {
      await interaction.reply({
        content: "❌ The leaderboard is currently empty!",
        ephemeral: true,
      });
      return; // Explicitly return after this case
    }

    const topUsers = allUsers.slice(0, 100); // Limit to top 100 users
    const usersPerPage = 10; // Number of users per page
    const totalPages = Math.ceil(topUsers.length / usersPerPage);
    let currentPage = 0;

    const generateEmbed = (page: number) => {
      const start = page * usersPerPage;
      const end = start + usersPerPage;
      const pageUsers = topUsers.slice(start, end);

      const description = pageUsers
        .map((entry, index) => {
          const rank = start + index + 1;
          const emoji =
            rank === 1
              ? "🥇"
              : rank === 2
                ? "🥈"
                : rank === 3
                  ? "🥉"
                  : `#${rank}`;
          return `${emoji} - <@${entry.id}>: \`${entry.balance} coins\``;
        })
        .join("\n");

      const embed = new EmbedBuilder()
        .setTitle("🏆 Leaderboard")
        .setDescription(description || "No data available.")
        .setColor(0xffd700)
        .setFooter({
          text: `Page ${page + 1} of ${totalPages}`,
        })
        .setTimestamp();

      return embed;
    };

    const generateButtons = () => {
      return new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId("previous")
          .setLabel("Previous")
          .setStyle(ButtonStyle.Primary)
          .setDisabled(currentPage === 0),
        new ButtonBuilder()
          .setCustomId("next")
          .setLabel("Next")
          .setStyle(ButtonStyle.Primary)
          .setDisabled(currentPage === totalPages - 1),
      );
    };

    // Initial reply with the first page
    const replyMessage = await interaction.reply({
      embeds: [generateEmbed(currentPage)],
      components: [generateButtons()],
      fetchReply: true,
    });

    // Create a collector for button interactions
    const collector = replyMessage.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 60000, // Collector runs for 60 seconds
    });

    collector.on("collect", async (buttonInteraction) => {
      if (buttonInteraction.user.id !== interaction.user.id) {
        await buttonInteraction.reply({
          content: "❌ You cannot interact with this menu.",
          ephemeral: true,
        });
        return;
      }

      if (buttonInteraction.customId === "previous" && currentPage > 0) {
        currentPage--;
      } else if (
        buttonInteraction.customId === "next" &&
        currentPage < totalPages - 1
      ) {
        currentPage++;
      }

      await buttonInteraction.update({
        embeds: [generateEmbed(currentPage)],
        components: [generateButtons()],
      });
    });

    collector.on("end", async () => {
      await interaction.editReply({
        components: [],
      });
    });

    return; // Explicit return to resolve the method
  }
}
