// src/commands/user/slots.ts

import { ApplicationCommandRegistry, Command } from "@sapphire/framework";
import { ChatInputCommandInteraction, EmbedBuilder } from "discord.js";

import { UserData } from "../../database/enmap.js";
import { logAction } from "../../utils/events.js";

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

  async chatInputRun(interaction: ChatInputCommandInteraction): Promise<void> {
    const user = interaction.user;
    const amount = interaction.options.getInteger("amount", true);

    // Ensure user data exists and is type-safe
    const userData = UserData.ensure(user.id, { balance: 0 });

    if (amount <= 0 || userData.balance < amount) {
      await interaction.reply({
        content: "❌ Invalid bet amount. Ensure you have enough coins to play.",
        ephemeral: true,
      });
      return;
    }

    // Symbol payout multipliers (ascending in value)
    const symbols: { emoji: string; multiplier: number }[] = [
      { emoji: "🍋", multiplier: 2 },
      { emoji: "🍊", multiplier: 3 },
      { emoji: "🍇", multiplier: 4 },
      { emoji: "🍒", multiplier: 5 },
      { emoji: "⭐", multiplier: 10 },
      { emoji: "💎", multiplier: 20 },
    ];

    // Generate a 3x3 grid of random symbols
    const grid: { emoji: string; multiplier: number }[][] = Array(3)
      .fill(null)
      .map(() =>
        Array(3)
          .fill(null)
          .map(() => symbols[Math.floor(Math.random() * symbols.length)])
      );

    // Format the slot machine grid
    const formatSlotMachine = (grid: { emoji: string }[][]): string => {
      const topBorder = "╭───────────────╮";
      const bottomBorder = "╰───────────────╯";
      const rows = grid
        .map((row) => `│ ${row.map((symbol) => symbol.emoji).join(" | ")} │`)
        .join("\n");
      return `${topBorder}\n${rows}\n${bottomBorder}`;
    };

    const slotMachine = formatSlotMachine(grid);

    // Calculate winnings and track hits
    const hits: string[] = [];
    let totalWinnings = 0;

    const checkMatch = (line: { multiplier: number }[]): boolean =>
      line.every((symbol) => symbol.multiplier === line[0].multiplier);

    // Check rows
    for (const row of grid) {
      if (checkMatch(row)) {
        totalWinnings += amount * row[0].multiplier;
        hits.push(`${row[0].emoji} ×3 (Row)`);
      }
    }

    // Check columns
    for (let col = 0; col < 3; col++) {
      const column = grid.map((row) => row[col]);
      if (checkMatch(column)) {
        totalWinnings += amount * column[0].multiplier;
        hits.push(`${column[0].emoji} ×3 (Column)`);
      }
    }

    // Check diagonals
    const mainDiagonal = [grid[0][0], grid[1][1], grid[2][2]];
    const antiDiagonal = [grid[0][2], grid[1][1], grid[2][0]];
    if (checkMatch(mainDiagonal)) {
      totalWinnings += amount * mainDiagonal[0].multiplier * 2; // Bonus for diagonals
      hits.push(`${mainDiagonal[0].emoji} ×3 (Diagonal)`);
    }
    if (checkMatch(antiDiagonal)) {
      totalWinnings += amount * antiDiagonal[0].multiplier * 2;
      hits.push(`${antiDiagonal[0].emoji} ×3 (Diagonal)`);
    }

    // Update user balance
    if (totalWinnings > 0) {
      userData.balance += totalWinnings;
    } else {
      userData.balance -= amount;
    }
    UserData.set(user.id, userData);

    // Prepare embed
    const embed = new EmbedBuilder()
      .setTitle("🎰 Slot Machine 🎰")
      .setColor(totalWinnings > 0 ? 0x22c55e : 0xf87171)
      .setDescription(
        totalWinnings > 0
          ? `🎉 **You Won!** 🎉\n\`\`\`\n${slotMachine}\n\`\`\`\nYou won **${totalWinnings} coins**!`
          : `💔 **Better Luck Next Time!** 💔\n\`\`\`\n${slotMachine}\n\`\`\`\nYou lost **${amount} coins**.`
      )
      .addFields(
        { name: "Bet Amount", value: `${amount} coins`, inline: true },
        { name: "Winnings", value: `${totalWinnings} coins`, inline: true },
        {
          name: "New Balance",
          value: `${userData.balance} coins`,
          inline: true,
        }
      )
      .setTimestamp();

    // Add hit details if there are any
    if (hits.length > 0) {
      embed.addFields({
        name: "Hits",
        value: hits.join("\n"),
        inline: false,
      });
    }

    await interaction.reply({ embeds: [embed] });

    // Log action
    await logAction(
      interaction.guildId || "",
      {
        user: user.id,
        action: "slots",
        amount: totalWinnings > 0 ? totalWinnings : -amount,
        description:
          totalWinnings > 0
            ? `User won ${totalWinnings} coins in slots.`
            : `User lost ${amount} coins in slots.`,
      },
      interaction.client
    );
  }
}
