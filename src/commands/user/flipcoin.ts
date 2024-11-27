import { ApplicationCommandRegistry, Command } from "@sapphire/framework";
import { ChatInputCommandInteraction, EmbedBuilder } from "discord.js";

import { UserData } from "../../database/enmap.js";
import { logAction } from "../../utils/events.js";

export default class FlipCoinCommand extends Command {
  constructor(context: Command.Context, options: Command.Options) {
    super(context, {
      ...options,
      name: "flipcoin",
      description: "Bet coins on a coin flip (heads or tails).",
    });
  }

  registerApplicationCommands(registry: ApplicationCommandRegistry) {
    registry.registerChatInputCommand((builder) =>
      builder
        .setName(this.name)
        .setDescription(this.description)
        .addStringOption((option) =>
          option
            .setName("choice")
            .setDescription("Choose heads or tails.")
            .setRequired(true)
            .addChoices(
              { name: "Heads", value: "heads" },
              { name: "Tails", value: "tails" },
            ),
        )
        .addIntegerOption((option) =>
          option
            .setName("amount")
            .setDescription("The amount of coins to bet.")
            .setRequired(true),
        ),
    );
  }

  async chatInputRun(interaction: ChatInputCommandInteraction): Promise<void> {
    const user = interaction.user;
    const choice = interaction.options.getString("choice", true);
    const amount = interaction.options.getInteger("amount", true);

    // Ensure user data and balance
    const userData = UserData.ensure(user.id, { balance: 0 });

    if (amount <= 0 || userData.balance < amount) {
      await interaction.reply({
        content: "❌ Invalid bet amount. Ensure you have enough coins to bet.",
        ephemeral: true,
      });
      return;
    }

    // Simulate coin flip
    const result = Math.random() < 0.5 ? "heads" : "tails";
    const coinEmoji = result === "heads" ? "🪙" : "🪙";

    // Determine win/loss
    const isWin = result === choice;
    const outcomeMessage = isWin
      ? `🎉 **You won \`${amount} coins\`!**`
      : `💔 **You lost \`${amount} coins\`.**`;

    if (isWin) {
      userData.balance += amount;
    } else {
      userData.balance -= amount;
    }

    UserData.set(user.id, userData);

    // Create the embed
    const embed = new EmbedBuilder()
      .setTitle("🪙 Coin Flip Result 🪙")
      .setColor(isWin ? 0x22c55e : 0xf87171) // Green for win, red for loss
      .setDescription(
        `${coinEmoji} The coin flipped and landed on **${result.toUpperCase()}**.\n\n${outcomeMessage}`,
      )
      .addFields(
        { name: "Your Choice", value: choice.toUpperCase(), inline: true },
        { name: "Result", value: result.toUpperCase(), inline: true },
        {
          name: "New Balance",
          value: `${userData.balance} coins`,
          inline: true,
        },
      )
      .setTimestamp();

    // Reply to the user
    await interaction.reply({ embeds: [embed] });

    // Log the action
    await logAction(
      interaction.guildId || "",
      {
        user: user.id,
        action: "flipcoin",
        amount: isWin ? amount : -amount,
        description: `User ${
          isWin ? "won" : "lost"
        } ${amount} coins in a coin flip (${choice}).`,
      },
      interaction.client,
    );
  }
}
