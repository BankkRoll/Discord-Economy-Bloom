import { ApplicationCommandRegistry, Command } from "@sapphire/framework";
import { ShopData, UserData } from "../../database/enmap";

import { ChatInputCommandInteraction } from "discord.js";
import { createEmbed } from "../../utils/embed";
import { logAction } from "../../listeners/events";

export default class BuyCommand extends Command {
  constructor(context: Command.Context, options: Command.Options) {
    super(context, {
      ...options,
      name: "buy",
      description: "Purchase an item from the shop.",
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
            .setDescription("The name of the item to buy.")
            .setRequired(true)
        )
    );
  }

  async chatInputRun(interaction: ChatInputCommandInteraction) {
    const user = interaction.user;
    const itemName = interaction.options.getString("item", true);

    const item = ShopData.get(itemName);
    if (!item) {
      return interaction.reply({
        content: `❌ The item **${itemName}** does not exist in the shop.`,
        ephemeral: true,
      });
    }

    const userData = UserData.ensure(user.id, { balance: 0, inventory: [] });
    if (userData.balance < item.price) {
      return interaction.reply({
        content: `❌ You don't have enough coins to buy **${itemName}**. It costs \`${item.price} coins\`.`,
        ephemeral: true,
      });
    }

    userData.balance -= item.price;
    const inventoryItem = userData.inventory.find(
      (i: any) => i.item === itemName
    );
    if (inventoryItem) {
      inventoryItem.quantity += 1;
    } else {
      userData.inventory.push({ item: itemName, quantity: 1 });
    }
    UserData.set(user.id, userData);

    const embed = createEmbed({
      title: "Purchase Successful",
      fields: [
        { name: "Item", value: itemName, inline: true },
        { name: "Price", value: `${item.price} coins`, inline: true },
        {
          name: "Remaining Balance",
          value: `${userData.balance} coins`,
          inline: true,
        },
      ],
      color: 0x22c55e,
      timestamp: new Date(),
    });

    await interaction.reply({ embeds: [embed] });

    await logAction(
      interaction.guildId || "",
      {
        user: user.id,
        action: "buy",
        item: itemName,
        amount: item.price,
        description: `User purchased **${itemName}** for \`${item.price} coins\`.`,
      },
      interaction.client
    );

    return; // Ensure all code paths return a value
  }
}
