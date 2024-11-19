import { ApplicationCommandRegistry, Command } from "@sapphire/framework";

import { ChatInputCommandInteraction } from "discord.js";
import { UserData } from "../../database/enmap";
import { createEmbed } from "../../utils/embed";
import { logAction } from "../../listeners/events";

export default class SlotsCommand extends Command {
  constructor(context: Command.Context, options: Command.Options) {
    super(context, {
      ...options,
      name: "slots",
      description: "Play a slot machine game to win coins with a 3x3 layout!",
    });
  }

  registerApplicationCommands(registry: ApplicationCommandRegistry) {
    registry.registerChatInputCommand((builder) =>
      builder
        .setName(this.name)
        .setDescription(this.description)
        .addIntegerOption((option) =>
          option
            .setName("amount")
            .setDescription("The amount of coins to bet.")
            .setRequired(true)
        )
    );
  }

  async chatInputRun(interaction: ChatInputCommandInteraction) {
    const user = interaction.user;
    const amount = interaction.options.getInteger("amount", true);
    const userData = UserData.ensure(user.id, { balance: 0 });

    if (amount <= 0 || userData.balance < amount) {
      await interaction.reply({
        content: "❌ Invalid bet amount. Ensure you have enough coins to play.",
        ephemeral: true,
      });
      return;
    }

    const symbols = ["🍒", "🍋", "🍊", "🍇", "🔔", "⭐", "💎"];
    const grid = Array(3)
      .fill(null)
      .map(() =>
        Array(3)
          .fill(null)
          .map(() => symbols[Math.floor(Math.random() * symbols.length)])
      );

    const formatSlotMachine = (grid: string[][]) => {
      const topBorder = "╭─────────────╮";
      const bottomBorder = "╰─────────────╯";
      const rows = grid
        .map((row) => `│ ${row.map((symbol) => `${symbol}`).join(" | ")} │`)
        .join("\n");
      return `${topBorder}\n${rows}\n${bottomBorder}`;
    };

    const slotMachine = formatSlotMachine(grid);

    const hasJackpot =
      grid[0][0] === grid[1][1] &&
      grid[1][1] === grid[2][2] &&
      grid[0][0] === grid[2][0]; // Diagonal and center match

    const isWinning =
      hasJackpot ||
      grid.some((row) => row.every((symbol) => symbol === row[0])) || // Rows
      [0, 1, 2].some((col) => grid.every((row) => row[col] === grid[0][col])); // Columns

    const winnings = isWinning ? amount * (hasJackpot ? 20 : 5) : 0;

    if (winnings > 0) {
      userData.balance += winnings;
    } else {
      userData.balance -= amount;
    }

    UserData.set(user.id, userData);

    const embed = createEmbed({
      title: "🎰 Slot Machine 🎰",
      description: `\`\`\`\n${slotMachine}\n\`\`\``,
      color: winnings > 0 ? 0x22c55e : 0xf87171,
      fields: [
        { name: "Bet Amount", value: `${amount} coins`, inline: true },
        { name: "Winnings", value: `${winnings} coins`, inline: true },
        {
          name: "New Balance",
          value: `${userData.balance} coins`,
          inline: true,
        },
      ],
      timestamp: new Date(),
    });

    if (winnings > 0) {
      embed.setDescription(
        `🎉 **You Won!** 🎉\n\`\`\`\n${slotMachine}\n\`\`\`\nYou won **${winnings} coins**!`
      );
    } else {
      embed.setDescription(
        `💔 **Better Luck Next Time!** 💔\n\`\`\`\n${slotMachine}\n\`\`\`\nYou lost **${amount} coins**.`
      );
    }

    await interaction.reply({ embeds: [embed] });

    await logAction(
      interaction.guildId || "",
      {
        user: user.id,
        action: "slots",
        amount: winnings > 0 ? winnings : -amount,
        description:
          winnings > 0
            ? `User won ${winnings} coins in slots.`
            : `User lost ${amount} coins in slots.`,
      },
      interaction.client
    );
  }
}
