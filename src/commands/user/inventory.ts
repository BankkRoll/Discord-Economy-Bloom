import { ApplicationCommandRegistry, Command } from "@sapphire/framework";

import { ChatInputCommandInteraction } from "discord.js";
import { UserData } from "../../database/enmap";
import { createEmbed } from "../../utils/embed";

export default class InventoryCommand extends Command {
  constructor(context: Command.Context, options: Command.Options) {
    super(context, {
      ...options,
      name: "inventory",
      description: "Check your inventory or another user's inventory.",
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
            .setDescription("The user whose inventory to check.")
            .setRequired(false),
        ),
    );
  }

  async chatInputRun(interaction: ChatInputCommandInteraction) {
    const user = interaction.options.getUser("user") || interaction.user;
    const userData = UserData.get(user.id) || { inventory: [] };

    if (userData.inventory.length === 0) {
      return interaction.reply({
        content: `${user.username} has no items in their inventory.`,
        ephemeral: true,
      });
    }

    const inventoryList = userData.inventory
      .map((item: { item: string; quantity: number }) => `**${item.item}** - \`${item.quantity}\``)
      .join("\n");

    const embed = createEmbed({
      title: `${user.username}'s Inventory`,
      description: inventoryList,
      color: 0x2563eb,
    });

    return interaction.reply({ embeds: [embed] });
  }
}
