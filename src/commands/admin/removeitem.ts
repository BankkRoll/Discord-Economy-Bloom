import { ApplicationCommandRegistry, Command } from "@sapphire/framework";

import { ChatInputCommandInteraction } from "discord.js";
import { ShopData } from "../../database/enmap";
import { createEmbed } from "../../utils/embed";
import { hasAdminOrRolePermission } from "../../utils/permissions";
import { logAction } from "../../listeners/events";

export default class RemoveItemCommand extends Command {
  constructor(context: Command.Context, options: Command.Options) {
    super(context, {
      ...options,
      name: "removeitem",
      description: "Remove an item from the shop.",
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
            .setDescription("The name of the item to remove.")
            .setRequired(true)
        )
    );
  }

  async chatInputRun(interaction: ChatInputCommandInteraction) {
    const item = interaction.options.getString("item", true);

    const member = interaction.guild?.members.cache.get(interaction.user.id);
    if (!hasAdminOrRolePermission(member, interaction.guildId)) {
      await interaction.reply({
        content: `❌ You do not have permission to use this command.`,
        ephemeral: true,
      });
      return; // Ensure early return on permission failure
    }

    if (!ShopData.has(item)) {
      await interaction.reply({
        content: `❌ An item with the name "${item}" does not exist in the shop.`,
        ephemeral: true,
      });
      return; // Ensure early return if item does not exist
    }

    // Remove Item from Shop
    ShopData.delete(item);

    // Create Embed for Interaction Reply
    const embed = createEmbed({
      title: "Item Removed",
      fields: [{ name: "Item Name", value: item, inline: true }],
      color: 0xe74c3c,
      timestamp: new Date(),
    });

    await interaction.reply({ embeds: [embed] });

    // Log the Action
    await logAction(
      interaction.guildId || "",
      {
        action: "removeitem",
        admin: interaction.user.id,
        description: `Admin removed the item "${item}" from the shop.`,
        item,
      },
      interaction.client
    );

    return; // Ensure the function resolves
  }
}
