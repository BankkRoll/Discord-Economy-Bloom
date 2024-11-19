import { ApplicationCommandRegistry, Command } from "@sapphire/framework";

import { ChatInputCommandInteraction } from "discord.js";
import { ShopData } from "../../database/enmap";
import { createEmbed } from "../../utils/embed";

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
    const shopItems = ShopData.fetchEverything();
    if (shopItems.size === 0) {
      await interaction.reply({
        content: "🛒 The shop is currently empty! Check back later.",
        ephemeral: true,
      });
      return;
    }

    const itemList = shopItems
      .map(
        (item, key) =>
          `**${key}** - \`${item.price} coins\`\n_${item.description || "No description provided."}_`
      )
      .join("\n\n");

    const embed = createEmbed({
      title: "🛍️ Shop Items",
      description: itemList,
      color: 0x2563eb,
      timestamp: new Date(),
    });

    await interaction.reply({ embeds: [embed] });
  }
}
