import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChatInputCommandInteraction,
  ComponentType,
  EmbedBuilder,
} from "discord.js";
import { ApplicationCommandRegistry, Command } from "@sapphire/framework";
import { ShopData, UserData } from "../../database/enmap.js";

export default class ShopCommand extends Command {
  constructor(context: Command.Context, options: Command.Options) {
    super(context, {
      ...options,
      name: "shop",
      description: "View items available in the shop and purchase them.",
    });
  }

  registerApplicationCommands(registry: ApplicationCommandRegistry) {
    registry.registerChatInputCommand((builder) =>
      builder.setName(this.name).setDescription(this.description),
    );
  }

  async chatInputRun(interaction: ChatInputCommandInteraction) {
    const items = Array.from(ShopData.entries());
    if (items.length === 0) {
      await interaction.reply({
        content: "🛒 The shop is currently empty! Check back later.",
        ephemeral: true,
      });
      return;
    }

    let currentItemIndex = 0;

    // Generate Embed for a single item
    const generateEmbed = (index: number) => {
      const [itemName, itemData] = items[index];

      const embed = new EmbedBuilder()
        .setTitle(`🛍️ Shop Item #${index}: ${itemName}`)
        .setColor(0x2563eb)
        .setDescription(itemData.description || "No description provided.")
        .addFields(
          { name: "💰 Price", value: `${itemData.price} coins`, inline: false },
          {
            name: "👮 Role Granted",
            value: itemData.role ? `<@&${itemData.role}>` : "None",
            inline: false,
          },
          {
            name: "📦 Inventory",
            value: itemData.inventory
              ? `${itemData.inventory - (itemData.sold || 0)} remaining`
              : "Unlimited",
            inline: false,
          },
          {
            name: "👤 User Limit",
            value: itemData.userLimit
              ? `${itemData.userLimit} per user`
              : "Unlimited",
            inline: false,
          },
        )
        .setFooter({
          text: `Item ${index + 1} of ${items.length}`,
        })
        .setTimestamp();

      if (itemData.imageUrl) {
        embed.setImage(itemData.imageUrl);
      }

      return embed;
    };

    // Generate Navigation Buttons
    const generateButtons = () => {
      return new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId("previous")
          .setLabel("Previous")
          .setStyle(ButtonStyle.Primary)
          .setDisabled(currentItemIndex === 0),
        new ButtonBuilder()
          .setCustomId("next")
          .setLabel("Next")
          .setStyle(ButtonStyle.Primary)
          .setDisabled(currentItemIndex === items.length - 1),
        new ButtonBuilder()
          .setCustomId("buy")
          .setLabel("Buy")
          .setStyle(ButtonStyle.Success),
      );
    };

    const replyMessage = await interaction.reply({
      embeds: [generateEmbed(currentItemIndex)],
      components: [generateButtons()],
      fetchReply: true,
    });

    const collector = replyMessage.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 60000, // 1 minute
    });

    collector.on("collect", async (buttonInteraction) => {
      if (buttonInteraction.user.id !== interaction.user.id) {
        await buttonInteraction.reply({
          content: "❌ You cannot interact with this menu.",
          ephemeral: true,
        });
        return;
      }

      if (buttonInteraction.customId === "previous" && currentItemIndex > 0) {
        currentItemIndex--;
      } else if (
        buttonInteraction.customId === "next" &&
        currentItemIndex < items.length - 1
      ) {
        currentItemIndex++;
      } else if (buttonInteraction.customId === "buy") {
        const [itemName, itemData] = items[currentItemIndex];
        const userData = UserData.ensure(interaction.user.id, {
          balance: 0,
          inventory: [],
        });

        if (userData.balance < itemData.price) {
          await buttonInteraction.reply({
            content: `❌ You don't have enough coins to buy **${itemName}**. It costs \`${itemData.price} coins\`.`,
            ephemeral: true,
          });
          return;
        }

        // Check inventory limits
        if (itemData.inventory && itemData.sold >= itemData.inventory) {
          await buttonInteraction.reply({
            content: `❌ This item is out of stock.`,
            ephemeral: true,
          });
          return;
        }

        // Check user limit
        const userPurchases = userData.inventory.find(
          (i: { item: string; quantity: number }) => i.item === itemName,
        );
        if (
          itemData.userLimit &&
          userPurchases?.quantity >= itemData.userLimit
        ) {
          await buttonInteraction.reply({
            content: `❌ You have reached the purchase limit for **${itemName}**.`,
            ephemeral: true,
          });
          return;
        }

        // Deduct balance, add to inventory, and update shop data
        userData.balance -= itemData.price;
        if (userPurchases) {
          userPurchases.quantity += 1;
        } else {
          userData.inventory.push({ item: itemName, quantity: 1 });
        }
        UserData.set(interaction.user.id, userData);

        itemData.sold = (itemData.sold || 0) + 1;
        ShopData.set(itemName, itemData);

        await buttonInteraction.reply({
          content: `✅ You successfully purchased **${itemName}** for \`${itemData.price} coins\`! Remaining Balance: \`${userData.balance} coins\`.`,
          ephemeral: true,
        });
        return;
      }

      // Update the embed and buttons
      await buttonInteraction.update({
        embeds: [generateEmbed(currentItemIndex)],
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
