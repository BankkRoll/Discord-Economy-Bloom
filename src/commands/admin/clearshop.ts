import { ApplicationCommandRegistry, Command } from "@sapphire/framework";

import { ChatInputCommandInteraction } from "discord.js";
import { ShopData } from "../../database/enmap.js";
import { createEmbed } from "../../utils/embed.js";
import { logAction } from "../../utils/events.js";
import { hasAdminOrRolePermission } from "../../utils/permissions.js";

export default class ClearShopCommand extends Command {
  constructor(context: Command.Context, options: Command.Options) {
    super(context, {
      ...options,
      name: "clearshop",
      description: "Clear all items from the shop.",
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

    // Clear Shop
    ShopData.clear();

    // Create Embed for Interaction Reply
    const embed = createEmbed({
      title: "Shop Cleared",
      description: "All items have been removed from the shop.",
      color: 0xe74c3c,
      timestamp: new Date(),
    });

    await interaction.reply({ embeds: [embed] });

    // Log the Action
    await logAction(
      interaction.guildId || "",
      {
        action: "clearshop",
        admin: interaction.user.id,
        description: "Admin cleared all items from the shop.",
      },
      interaction.client,
    );

    return; // Ensure function resolves
  }
}
