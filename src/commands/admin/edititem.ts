import { ApplicationCommandRegistry, Command } from "@sapphire/framework";

import { ChatInputCommandInteraction } from "discord.js";
import { ShopData } from "../../database/enmap";
import { createEmbed } from "../../utils/embed";
import { hasAdminOrRolePermission } from "../../utils/permissions";
import { logAction } from "../../listeners/events";

export default class EditItemCommand extends Command {
  constructor(context: Command.Context, options: Command.Options) {
    super(context, {
      ...options,
      name: "edititem",
      description: "Edit the price of an existing item in the shop.",
    });
  }

  registerApplicationCommands(registry: ApplicationCommandRegistry) {
    registry.registerChatInputCommand((builder) =>
      builder
        .setName(this.name)
        .setDescription(this.description)
        .addStringOption((option) =>
          option
            .setName("item")
            .setDescription("The name of the item to edit.")
            .setRequired(true),
        )
        .addIntegerOption((option) =>
          option
            .setName("new_price")
            .setDescription("The new price of the item.")
            .setRequired(true),
        ),
    );
  }

  async chatInputRun(interaction: ChatInputCommandInteraction) {
    const item = interaction.options.getString("item", true);
    const newPrice = interaction.options.getInteger("new_price", true);

    const member = interaction.guild?.members.cache.get(interaction.user.id);
    if (!hasAdminOrRolePermission(member, interaction.guildId)) {
      await interaction.reply({
        content: `❌ You do not have permission to use this command.`,
        ephemeral: true,
      });
      return; // Explicit return to ensure a resolved path
    }

    if (newPrice <= 0) {
      await interaction.reply({
        content: `❌ The price must be a positive integer.`,
        ephemeral: true,
      });
      return; // Explicit return to ensure a resolved path
    }

    if (!ShopData.has(item)) {
      await interaction.reply({
        content: `❌ An item with the name "${item}" does not exist in the shop.`,
        ephemeral: true,
      });
      return; // Explicit return to ensure a resolved path
    }

    // Edit Item Price
    const itemData = ShopData.get(item);
    itemData.price = newPrice;
    ShopData.set(item, itemData);

    // Create Embed for Interaction Reply
    const embed = createEmbed({
      title: "Item Price Updated",
      fields: [
        { name: "Item Name", value: item, inline: true },
        { name: "New Price", value: `${newPrice}`, inline: true },
      ],
      color: 0xf1c40f,
      timestamp: new Date(),
    });

    await interaction.reply({ embeds: [embed] });

    // Log the Action
    await logAction(
      interaction.guildId || "",
      {
        action: "edititem",
        admin: interaction.user.id,
        description: `Admin updated the price of "${item}" to ${newPrice}.`,
        item,
        amount: newPrice,
      },
      interaction.client,
    );

    return; // Ensure the method ends with a resolved path
  }
}
