import { ApplicationCommandRegistry, Command } from "@sapphire/framework";

import { ChatInputCommandInteraction } from "discord.js";
import { UserData } from "../../database/enmap.js";
import { createEmbed } from "../../utils/embed.js";
import { logAction } from "../../utils/events.js";
import { hasAdminOrRolePermission } from "../../utils/permissions.js";

export default class ResetInventoryCommand extends Command {
  constructor(context: Command.Context, options: Command.Options) {
    super(context, {
      ...options,
      name: "resetinventory",
      description: "Clear a user's inventory.",
    });
  }

  registerApplicationCommands(registry: ApplicationCommandRegistry) {
    registry.registerChatInputCommand((builder) =>
      builder
        .setName(this.name)
        .setDescription(this.description)
        .addUserOption((option) =>
          option
            .setName("user")
            .setDescription("The user whose inventory to reset.")
            .setRequired(true),
        ),
    );
  }

  async chatInputRun(interaction: ChatInputCommandInteraction) {
    const user = interaction.options.getUser("user", true);

    const member = interaction.guild?.members.cache.get(interaction.user.id);
    if (!hasAdminOrRolePermission(member, interaction.guildId)) {
      await interaction.reply({
        content: `❌ You do not have permission to use this command.`,
        ephemeral: true,
      });
      return;
    }

    // Reset Inventory
    const userData = UserData.ensure(user.id, { balance: 0, inventory: [] });
    userData.inventory = [];
    UserData.set(user.id, userData);

    // Create Embed for Interaction Reply
    const embed = createEmbed({
      title: "Inventory Reset",
      description: `📦 <@${user.id}>'s inventory has been cleared.`,
      color: 0xe74c3c,
      timestamp: new Date(),
    });

    await interaction.reply({ embeds: [embed] });

    // Log the Action
    await logAction(
      interaction.guildId || "",
      {
        user: user.id,
        action: "resetinventory",
        admin: interaction.user.id,
        description: `Admin cleared the inventory of <@${user.id}>.`,
      },
      interaction.client,
    );

    return;
  }
}
