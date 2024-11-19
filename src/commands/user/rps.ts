import { ApplicationCommandRegistry, Command } from "@sapphire/framework";

import { ChatInputCommandInteraction } from "discord.js";
import { UserData } from "../../database/enmap";
import { createEmbed } from "../../utils/embed";
import { logAction } from "../../listeners/events";

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

  async chatInputRun(interaction: ChatInputCommandInteraction) {
    const user = interaction.user;
    const userChoice = interaction.options.getString("choice", true) as "rock" | "paper" | "scissors";
    const betAmount = interaction.options.getInteger("amount", true);
    const userData = UserData.ensure(user.id, { balance: 0 });

    if (betAmount <= 0 || userData.balance < betAmount) {
      await interaction.reply({
        content: "❌ Invalid bet amount. Ensure you have enough coins to play.",
        ephemeral: true,
      });
      return;
    }

    const emojiMap: Record<"rock" | "paper" | "scissors", string> = {
      rock: "🪨 Rock",
      paper: "📄 Paper",
      scissors: "✂️ Scissors",
    };

    const choices: ("rock" | "paper" | "scissors")[] = ["rock", "paper", "scissors"];
    const botChoice = choices[Math.floor(Math.random() * choices.length)];

    let resultMessage = `🎮 You chose **${emojiMap[userChoice]}**\n🤖 Bot chose **${emojiMap[botChoice]}**\n\n`;

    let resultColor;
    let resultAmount = 0;

    if (userChoice === botChoice) {
      resultMessage += "It's a draw!";
      resultColor = 0xffd700;
    } else if (
      (userChoice === "rock" && botChoice === "scissors") ||
      (userChoice === "scissors" && botChoice === "paper") ||
      (userChoice === "paper" && botChoice === "rock")
    ) {
      userData.balance += betAmount;
      resultMessage += `🎉 You won \`${betAmount} coins\`!`;
      resultColor = 0x22c55e;
      resultAmount = betAmount;
    } else {
      userData.balance -= betAmount;
      resultMessage += `💔 You lost \`${betAmount} coins\`.`;
      resultColor = 0xf87171;
      resultAmount = -betAmount;
    }

    UserData.set(user.id, userData);

    const embed = createEmbed({
      title: "Rock-Paper-Scissors Result",
      fields: [
        { name: "Your Choice", value: emojiMap[userChoice], inline: true },
        { name: "Bot Choice", value: emojiMap[botChoice], inline: true },
        { name: "New Balance", value: `${userData.balance} coins`, inline: true },
      ],
      description: resultMessage,
      color: resultColor,
      timestamp: new Date(),
    });

    await interaction.reply({ embeds: [embed] });

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
}
