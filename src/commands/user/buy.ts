import { ApplicationCommandRegistry, Command } from "@sapphire/framework";
import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  GuildMember,
} from "discord.js";
import { ShopData, UserData } from "../../database/enmap.js";

import { logAction } from "../../utils/events.js";

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

    // Deduct balance and add item to inventory
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

    const embedFields = [
      { name: "Item", value: itemName, inline: true },
      { name: "Price", value: `${item.price} coins`, inline: true },
      {
        name: "Remaining Balance",
        value: `${userData.balance} coins`,
        inline: true,
      },
    ];

    let roleAssigned = false;

    // Handle role assignment if the item has an associated role
    if (item.roleId) {
      const guild = interaction.guild;
      const member = interaction.member as GuildMember;

      if (guild && member) {
        const role = guild.roles.cache.get(item.roleId);

        if (role) {
          await member.roles.add(role);
          roleAssigned = true;

          embedFields.push({
            name: "Role Granted",
            value: `You have been granted the **${role.name}** role.`,
            inline: false,
          });
        } else {
          embedFields.push({
            name: "Role Not Found",
            value: `The role associated with this item could not be found.`,
            inline: false,
          });
        }
      }
    }

    const embed = new EmbedBuilder()
      .setTitle("Purchase Successful")
      .addFields(embedFields)
      .setColor(0x22c55e)
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });

    // Log the Action
    await logAction(
      interaction.guildId || "",
      {
        user: user.id,
        action: "buy",
        item: itemName,
        amount: item.price,
        description: `User purchased **${itemName}** for \`${item.price} coins\`. ${
          roleAssigned ? "Role granted: Yes." : "Role granted: No."
        }`,
      },
      interaction.client
    );

    return; // Ensure all code paths return a value
  }
}
