import { ApplicationCommandRegistry, Command } from "@sapphire/framework";
import { ChatInputCommandInteraction, EmbedBuilder } from "discord.js";

import { UserData } from "../../database/enmap.js";
import { logAction } from "../../utils/events.js";

export default class RPSCommand extends Command {
  constructor(context: Command.Context, options: Command.Options) {
    super(context, {
      ...options,
      name: "rps",
      description: "Play rock-paper-scissors against the bot.",
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
            .setDescription("Choose rock, paper, or scissors.")
            .setRequired(true)
            .addChoices(
              { name: "🪨 Rock", value: "rock" },
              { name: "📄 Paper", value: "paper" },
              { name: "✂️ Scissors", value: "scissors" }
            )
        )
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
    const userChoice = interaction.options.getString("choice", true) as
      | "rock"
      | "paper"
      | "scissors";
    const betAmount = interaction.options.getInteger("amount", true);

    const userData = UserData.ensure(user.id, { balance: 0 });

    if (betAmount <= 0 || userData.balance < betAmount) {
      await interaction.reply({
        content: "❌ Invalid bet amount. Ensure you have enough coins to play.",
        ephemeral: true,
      });
      return;
    }

    // Emoji map for display
    const emojiMap: Record<"rock" | "paper" | "scissors", string> = {
      rock: "🪨 Rock",
      paper: "📄 Paper",
      scissors: "✂️ Scissors",
    };

    const outcomeWeights: {
      outcome: "win" | "lose" | "draw";
      weight: number;
    }[] = [
      { outcome: "win", weight: 30 },
      { outcome: "lose", weight: 50 },
      { outcome: "draw", weight: 20 },
    ];
    const outcome = this.weightedRandom(outcomeWeights);

    // Determine bot's choice based on the desired outcome
    const botChoice = this.calculateBotChoice(userChoice, outcome);

    // Prepare result details
    let resultMessage = `🎮 You chose **${emojiMap[userChoice]}**\n🤖 Bot chose **${emojiMap[botChoice]}**\n\n`;
    let resultColor: number;
    let resultAmount = 0;

    if (outcome === "draw") {
      resultMessage += "It's a draw!";
      resultColor = 0xffd700; // Gold
    } else if (outcome === "win") {
      userData.balance += betAmount;
      resultMessage += `🎉 You won \`${betAmount} coins\`!`;
      resultColor = 0x22c55e; // Green
      resultAmount = betAmount;
    } else {
      userData.balance -= betAmount;
      resultMessage += `💔 You lost \`${betAmount} coins\`.`;
      resultColor = 0xf87171; // Red
      resultAmount = -betAmount;
    }

    // Update user's balance
    UserData.set(user.id, userData);

    // Build embed response
    const embed = new EmbedBuilder()
      .setTitle("Rock-Paper-Scissors Result")
      .setColor(resultColor)
      .setDescription(resultMessage)
      .addFields(
        { name: "Your Choice", value: emojiMap[userChoice], inline: true },
        { name: "Bot Choice", value: emojiMap[botChoice], inline: true },
        {
          name: "New Balance",
          value: `${userData.balance} coins`,
          inline: true,
        }
      )
      .setTimestamp();

    // Reply to interaction
    await interaction.reply({ embeds: [embed] });

    // Log the action
    await logAction(
      interaction.guildId || "",
      {
        user: user.id,
        action: "rps",
        amount: resultAmount,
        description: `User played RPS (${emojiMap[userChoice]} vs. ${emojiMap[botChoice]}) and ${resultAmount > 0 ? "won" : "lost"} ${Math.abs(resultAmount)} coins.`,
      },
      interaction.client
    );
  }

  // Utility to pick a weighted random outcome
  private weightedRandom(
    weights: { outcome: "win" | "lose" | "draw"; weight: number }[]
  ): "win" | "lose" | "draw" {
    const totalWeight = weights.reduce((sum, w) => sum + w.weight, 0);
    const random = Math.random() * totalWeight;

    let cumulative = 0;
    for (const { outcome, weight } of weights) {
      cumulative += weight;
      if (random <= cumulative) {
        return outcome as "win" | "lose" | "draw";
      }
    }

    // Fallback (shouldn't happen, but needed for type safety)
    return "draw";
  }

  // Determine bot's choice based on user's choice and desired outcome
  private calculateBotChoice(
    userChoice: "rock" | "paper" | "scissors",
    outcome: "win" | "lose" | "draw"
  ): "rock" | "paper" | "scissors" {
    const choiceMap: Record<
      "rock" | "paper" | "scissors",
      "rock" | "paper" | "scissors"
    > = {
      rock: "scissors",
      paper: "rock",
      scissors: "paper",
    };

    if (outcome === "win") {
      return choiceMap[userChoice]; // Bot loses
    } else if (outcome === "lose") {
      return Object.keys(choiceMap).find(
        (key) => choiceMap[key as "rock" | "paper" | "scissors"] === userChoice
      ) as "rock" | "paper" | "scissors"; // Bot wins
    } else {
      return userChoice; // Draw
    }
  }
}
