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

import { ShopData } from "../../database/enmap.js";

export default class ShopCommand extends Command {
  constructor(context: Command.Context, options: Command.Options) {
    super(context, {
      ...options,
      name: "shop",
      description: "View items available in the shop.",
    });
  }

  registerApplicationCommands(registry: ApplicationCommandRegistry) {
    registry.registerChatInputCommand((builder) =>
      builder.setName(this.name).setDescription(this.description)
    );
  }

  async chatInputRun(interaction: ChatInputCommandInteraction) {
    // Convert ShopData to an array
    const items = Array.from(ShopData.entries());
    if (items.length === 0) {
      await interaction.reply({
        content: "🛒 The shop is currently empty! Check back later.",
        ephemeral: true,
      });
      return;
    }

    const itemsPerPage = 5;
    const pages = Math.ceil(items.length / itemsPerPage);
    let currentPage = 0;

    const generateEmbed = (page: number) => {
      const start = page * itemsPerPage;
      const end = start + itemsPerPage;
      const currentItems = items.slice(start, end);

      const embed = new EmbedBuilder()
        .setTitle("🛍️ Shop Items")
        .setColor(0x2563eb)
        .setTimestamp()
        .setFooter({ text: `Page ${page + 1} of ${pages}` });

      currentItems.forEach(([itemName, itemData]) => {
        embed.addFields({
          name: itemName as string,
          value: `**Price:** ${itemData.price} coins\n**Description:** ${
            itemData.description || "No description provided."
          }`,
          inline: false,
        });
      });

      return embed;
    };

    const generateButtons = () => {
      const buttons = new ActionRowBuilder<MessageActionRowComponentBuilder>();
      buttons.addComponents(
        new ButtonBuilder()
          .setCustomId("previous")
          .setLabel("Previous")
          .setStyle(ButtonStyle.Primary)
          .setDisabled(currentPage === 0),
        new ButtonBuilder()
          .setCustomId("next")
          .setLabel("Next")
          .setStyle(ButtonStyle.Primary)
          .setDisabled(currentPage === pages - 1)
      );
      return buttons;
    };

    const replyMessage = await interaction.reply({
      embeds: [generateEmbed(currentPage)],
      components: [generateButtons()],
      fetchReply: true,
    });

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
        currentPage < pages - 1
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
  }
}
