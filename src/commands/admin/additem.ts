import { ApplicationCommandRegistry, Command } from "@sapphire/framework";

import { ChatInputCommandInteraction } from "discord.js";
import { ShopData } from "../../database/enmap";
import { createEmbed } from "../../utils/embed";
import { hasAdminOrRolePermission } from "../../utils/permissions";
import { logAction } from "../../listeners/events";

export default class AddItemCommand extends Command {
  constructor(context: Command.Context, options: Command.Options) {
    super(context, {
      ...options,
      name: "additem",
      description: "Add a new item to the shop.",
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
            .setDescription("The name of the item to add.")
            .setRequired(true),
        )
        .addIntegerOption((option) =>
          option
            .setName("price")
            .setDescription("The price of the item.")
            .setRequired(true),
        ),
    );
  }

  async chatInputRun(interaction: ChatInputCommandInteraction) {
    const item = interaction.options.getString("item", true);
    const price = interaction.options.getInteger("price", true);

    const member = interaction.guild?.members.cache.get(interaction.user.id);
    if (!hasAdminOrRolePermission(member, interaction.guildId)) {
      await interaction.reply({
        content: `❌ You do not have permission to use this command.`,
        ephemeral: true,
      });
      return;
    }

    if (price <= 0) {
      await interaction.reply({
        content: `❌ The price must be a positive integer.`,
        ephemeral: true,
      });
      return;
    }

    if (ShopData.has(item)) {
      await interaction.reply({
        content: `❌ An item with the name "${item}" already exists in the shop.`,
        ephemeral: true,
      });
      return;
    }

    // Add Item to Shop
    ShopData.set(item, { price, description: "No description provided." });

    // Create Embed for Interaction Reply
    const embed = createEmbed({
      title: "Item Added",
      fields: [
        { name: "Item Name", value: item, inline: true },
        { name: "Price", value: `${price}`, inline: true },
      ],
      color: 0x3498db,
      timestamp: new Date(),
    });

    await interaction.reply({ embeds: [embed] });

    // Log the Action
    await logAction(
      interaction.guildId || "",
      {
        action: "additem",
        admin: interaction.user.id,
        description: `Admin added the item "${item}" with a price of ${price} to the shop.`,
        item,
        amount: price,
      },
      interaction.client,
    );

    return; // Ensure function resolves
  }
}
