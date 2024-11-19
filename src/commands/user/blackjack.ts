import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChatInputCommandInteraction,
  ComponentType,
} from "discord.js";
import { ApplicationCommandRegistry, Command } from "@sapphire/framework";

import { UserData } from "../../database/enmap";
import { createEmbed } from "../../utils/embed";
import { logAction } from "../../listeners/events";

export default class BlackjackCommand extends Command {
  constructor(context: Command.Context, options: Command.Options) {
    super(context, {
      ...options,
      name: "blackjack",
      description: "Play a game of blackjack for coins.",
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
    const client = interaction.client;
    const user = interaction.user;
    const betAmount = interaction.options.getInteger("amount", true);
    const userData = UserData.ensure(user.id, { balance: 0 });

    if (betAmount <= 0 || userData.balance < betAmount) {
      await interaction.reply({
        content: "❌ Invalid bet amount. Ensure you have enough coins to play.",
        ephemeral: true,
      });
      return;
    }

    let userHand = [this.drawCard(), this.drawCard()];
    let dealerHand = [this.drawCard(), this.drawCard()];
    let userStand = false;

    const calculateScore = (hand: string[]) => {
      let score = 0;
      let aces = 0;
      for (const card of hand) {
        if (["K", "Q", "J"].includes(card)) {
          score += 10;
        } else if (card === "A") {
          aces += 1;
          score += 11;
        } else {
          score += parseInt(card);
        }
      }
      while (score > 21 && aces > 0) {
        score -= 10;
        aces -= 1;
      }
      return score;
    };

    const createGameEmbed = (showDealer = false) => {
      return createEmbed({
        title: "Blackjack",
        fields: [
          {
            name: "Your Hand",
            value: `${userHand.join(" ")} (Score: ${calculateScore(userHand)})`,
            inline: true,
          },
          {
            name: "Dealer's Hand",
            value: showDealer
              ? `${dealerHand.join(" ")} (Score: ${calculateScore(dealerHand)})`
              : `${dealerHand[0]} ❓`,
            inline: true,
          },
        ],
        color: 0x2563eb,
        timestamp: new Date(),
      });
    };

    const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId("hit")
        .setLabel("Hit")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId("stand")
        .setLabel("Stand")
        .setStyle(ButtonStyle.Secondary)
    );

    await interaction.reply({
      embeds: [createGameEmbed()],
      components: [actionRow],
    });

    const collector = interaction.channel?.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 60000,
    });

    collector?.on("collect", async (buttonInteraction) => {
      if (buttonInteraction.user.id !== user.id) {
        await buttonInteraction.reply({
          content: "This game isn't for you!",
          ephemeral: true,
        });
        return;
      }

      if (buttonInteraction.customId === "hit") {
        userHand.push(this.drawCard());
        if (calculateScore(userHand) > 21) {
          collector.stop("bust");
        }
      } else if (buttonInteraction.customId === "stand") {
        userStand = true;
        collector.stop("stand");
      }

      if (!userStand && calculateScore(userHand) <= 21) {
        await buttonInteraction.update({
          embeds: [createGameEmbed()],
          components: [actionRow],
        });
      }
    });

    collector?.on("end", async (_, reason) => {
      if (reason === "time") {
        await interaction.followUp({
          content: "⏰ Game timed out!",
          ephemeral: true,
        });
        return;
      }

      while (calculateScore(dealerHand) < 17) {
        dealerHand.push(this.drawCard());
      }

      const userScore = calculateScore(userHand);
      const dealerScore = calculateScore(dealerHand);
      let resultMessage = "";

      if (reason === "bust" || userScore > 21) {
        userData.balance -= betAmount;
        resultMessage = "💔 You busted and lost your bet!";
      } else if (dealerScore > 21 || userScore > dealerScore) {
        userData.balance += betAmount;
        resultMessage = `🎉 You won \`${betAmount} coins\`!`;
      } else if (userScore === dealerScore) {
        resultMessage = "🤝 It's a tie! Your bet is returned.";
      } else {
        userData.balance -= betAmount;
        resultMessage = `💔 You lost \`${betAmount} coins\`.`;
      }

      UserData.set(user.id, userData);

      const resultEmbed = createGameEmbed(true)
        .setTitle("Blackjack - Game Over")
        .setDescription(resultMessage)
        .setColor(
          userScore > 21 || dealerScore > userScore ? 0xf87171 : 0x22c55e
        );

      await interaction.followUp({ embeds: [resultEmbed], components: [] });

      await logAction(
        interaction.guildId || "",
        {
          user: user.id,
          action: "blackjack",
          amount:
            userScore > 21 || dealerScore > userScore ? -betAmount : betAmount,
          description: `User ${userScore > 21 || dealerScore > userScore ? "lost" : "won"} ${betAmount} coins in Blackjack.`,
        },
        client
      );
    });
  }

  drawCard() {
    const cards = [
      "A",
      "2",
      "3",
      "4",
      "5",
      "6",
      "7",
      "8",
      "9",
      "10",
      "J",
      "Q",
      "K",
    ];
    return cards[Math.floor(Math.random() * cards.length)];
  }
}
