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
import { hasAdminOrRolePermission } from "../../utils/permissions.js";

export default class ViewItemsCommand extends Command {
  constructor(context: Command.Context, options: Command.Options) {
    super(context, {
      ...options,
      name: "viewitems",
      description: "View all items in the shop.",
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

    // Convert the ShopData entries to an array
    const items = Array.from(ShopData.entries());
    if (items.length === 0) {
      await interaction.reply({
        content: "❌ No items available in the shop currently.",
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
        .setTitle("Shop Items")
        .setColor(0x3498db)
        .setTimestamp()
        .setFooter({ text: `Page ${page + 1} of ${pages}` });

      currentItems.forEach(([itemName, itemData]) => {
        let value = `**Price:** ${itemData.price} coins`;

        if (itemData.description) {
          value += `\n**Description:** ${itemData.description}`;
        }
        if (itemData.role) {
          value += `\n**Role:** <@&${itemData.role}>`;
        }
        if (itemData.inventory !== undefined) {
          value += `\n**Inventory:** ${
            itemData.inventory !== null
              ? `${itemData.inventory} available`
              : "Unlimited"
          }`;
        }
        if (itemData.userLimit !== undefined) {
          value += `\n**User Limit:** ${
            itemData.userLimit !== null
              ? `${itemData.userLimit} per user`
              : "Unlimited"
          }`;
        }

        embed.addFields({
          name: itemName as string,
          value,
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
          .setDisabled(currentPage === pages - 1),
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
