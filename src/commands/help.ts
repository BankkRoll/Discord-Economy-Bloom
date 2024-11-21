import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChatInputCommandInteraction,
  ComponentType,
  EmbedBuilder,
  MessageActionRowComponentBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuInteraction,
} from "discord.js";
import { ApplicationCommandRegistry, Command } from "@sapphire/framework";

import { hasAdminOrRolePermission } from "../utils/permissions";

type CommandCategory = {
  emoji: string;
  name: string;
  description: string;
};

export default class HelpCommand extends Command {
  constructor(context: Command.Context, options: Command.Options) {
    super(context, {
      ...options,
      name: "help",
      description: "Displays a categorized list of commands.",
    });
  }

  registerApplicationCommands(registry: ApplicationCommandRegistry) {
    registry.registerChatInputCommand((builder) =>
      builder.setName(this.name).setDescription(this.description)
    );
  }

  async chatInputRun(interaction: ChatInputCommandInteraction) {
    const isAdmin = hasAdminOrRolePermission(
      interaction.guild?.members.cache.get(interaction.user.id),
      interaction.guildId
    );

    const categories: Record<string, CommandCategory[]> = {
      "💼 User Commands": [
        {
          emoji: "💰",
          name: "/balance",
          description: "Displays your current balance.",
        },
        {
          emoji: "🎁",
          name: "/daily",
          description: "Claims a daily reward of coins.",
        },
        {
          emoji: "📅",
          name: "/weekly",
          description: "Claims a weekly reward of coins.",
        },
        {
          emoji: "🛠️",
          name: "/work",
          description: "Earn coins by completing a task.",
        },
        {
          emoji: "🛒",
          name: "/buy",
          description: "Buy an item from the shop.",
        },
        {
          emoji: "📜",
          name: "/shop",
          description: "View all available items in the shop.",
        },
        {
          emoji: "🎒",
          name: "/inventory",
          description: "Check your inventory.",
        },
        {
          emoji: "🏆",
          name: "/leaderboard",
          description: "View the leaderboard rankings.",
        },
        {
          emoji: "🪙",
          name: "/flipcoin",
          description: "Bet coins on a coin flip.",
        },
        {
          emoji: "🎰",
          name: "/slots",
          description: "Play a slot machine game.",
        },
        {
          emoji: "🃏",
          name: "/blackjack",
          description: "Play a blackjack game.",
        },
        {
          emoji: "✂️",
          name: "/rps",
          description: "Play rock-paper-scissors against the bot.",
        },
        {
          emoji: "🎡",
          name: "/spinwheel",
          description: "Spin the wheel for random rewards.",
        },
        {
          emoji: "🎟️",
          name: "/lottery-ticket",
          description: "Buy and scratch a lottery ticket.",
        },
      ],
      ...(isAdmin && {
        "🔧 Admin Commands": [
          {
            emoji: "🔧",
            name: "/setup",
            description: "Configures economy settings.",
          },
          {
            emoji: "➕",
            name: "/addcoins",
            description: "Adds coins to a user's account.",
          },
          {
            emoji: "➖",
            name: "/removecoins",
            description: "Removes coins from a user's account.",
          },
          {
            emoji: "✏️",
            name: "/setcoins",
            description: "Sets a user's balance.",
          },
          {
            emoji: "🛍️",
            name: "/additem",
            description: "Adds a new item to the shop.",
          },
          {
            emoji: "❌",
            name: "/removeitem",
            description: "Removes an item from the shop.",
          },
          {
            emoji: "⚙️",
            name: "/edititem",
            description: "Edits the price of an item in the shop.",
          },
          {
            emoji: "🧹",
            name: "/clearshop",
            description: "Removes all items from the shop.",
          },
          {
            emoji: "🧺",
            name: "/resetinventory",
            description: "Clears a user's inventory.",
          },
          {
            emoji: "📉",
            name: "/resetleaderboard",
            description: "Resets the leaderboard.",
          },
          {
            emoji: "❎",
            name: "/disableeconomy",
            description: "Disables the economy system.",
          },
          {
            emoji: "✅",
            name: "/enableeconomy",
            description: "Re-enables the economy system.",
          },
        ],
      }),
    };

    const menuOptions = Object.keys(categories).map((category) => ({
      label: category,
      value: category,
    }));

    const selectMenu =
      new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId("help-menu")
          .setPlaceholder("Select a command category")
          .addOptions(menuOptions)
      );

    const mainEmbed = new EmbedBuilder()
      .setTitle("Help Menu")
      .setDescription(
        "Use the dropdown menu below to explore available commands."
      )
      .setColor(0x3498db);

    const mainRow =
      new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId("help-back")
          .setLabel("Back")
          .setStyle(ButtonStyle.Primary)
          .setDisabled(true)
      );

    const response = await interaction.reply({
      embeds: [mainEmbed],
      components: [selectMenu, mainRow],
      ephemeral: true,
    });

    const collector = response.createMessageComponentCollector({
      componentType: ComponentType.StringSelect,
      time: 60000,
    });

    collector.on(
      "collect",
      async (menuInteraction: StringSelectMenuInteraction) => {
        if (menuInteraction.customId !== "help-menu") return;

        const selectedCategory = menuInteraction.values[0];
        const commands = categories[selectedCategory];
        const fields = commands.map((command: CommandCategory) => ({
          name: `${command.emoji} ${command.name}`,
          value: command.description,
        }));

        const categoryEmbed = new EmbedBuilder()
          .setTitle(selectedCategory)
          .addFields(fields)
          .setColor(0x2ecc71);

        await menuInteraction.update({
          embeds: [categoryEmbed],
          components: [selectMenu],
        });
      }
    );

    collector.on("end", async () => {
      const disabledMenu =
        new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
          new StringSelectMenuBuilder()
            .setCustomId("help-menu-disabled")
            .setPlaceholder("Menu expired")
            .setDisabled(true)
            .addOptions(menuOptions)
        );

      await interaction.editReply({ components: [disabledMenu] });
    });
  }
}
