import { ApplicationCommandRegistry, Command } from "@sapphire/framework";
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChatInputCommandInteraction,
  ComponentType,
} from "discord.js";

import { UserData } from "../../database/enmap.js";
import { createEmbed } from "../../utils/embed.js";
import { logAction } from "../../utils/events.js";

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

    const deck = this.createDeck();
    let userHand = [this.drawCard(deck), this.drawCard(deck)];
    let dealerHand = [this.drawCard(deck), this.drawCard(deck)];
    let userStand = false;

    const calculateScore = (hand: { emoji: string; value: number }[]) => {
      let score = 0;
      let aces = 0;
      for (const card of hand) {
        score += card.value;
        if (card.emoji.includes("🂡") || card.emoji.includes("🂱")) aces += 1;
      }
      while (score > 21 && aces > 0) {
        score -= 10;
        aces -= 1;
      }
      return score;
    };

    const formatHand = (hand: { emoji: string }[]) =>
      hand.map((card) => card.emoji).join(" ");

    const createGameEmbed = (showDealer = false) => {
      return createEmbed({
        title: "Blackjack",
        fields: [
          {
            name: "Your Hand",
            value: `${formatHand(userHand)} (Score: ${calculateScore(userHand)})`,
            inline: true,
          },
          {
            name: "Dealer's Hand",
            value: showDealer
              ? `${formatHand(dealerHand)} (Score: ${calculateScore(dealerHand)})`
              : `${dealerHand[0].emoji} ❓`,
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

    const replyMessage = await interaction.reply({
      embeds: [createGameEmbed()],
      components: [actionRow],
      fetchReply: true,
    });

    const collector = replyMessage.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 60000,
    });

    collector.on("collect", async (buttonInteraction) => {
      if (buttonInteraction.user.id !== user.id) {
        await buttonInteraction.reply({
          content: "This game isn't for you!",
          ephemeral: true,
        });
        return;
      }

      if (buttonInteraction.customId === "hit") {
        userHand.push(this.drawCard(deck));

        if (calculateScore(userHand) === 21) {
          collector.stop("user_21");
        } else if (calculateScore(userHand) > 21) {
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

    collector.on("end", async (_, reason) => {
      let resultMessage = "";
      while (calculateScore(dealerHand) < 17) {
        dealerHand.push(this.drawCard(deck));
      }

      const userScore = calculateScore(userHand);
      const dealerScore = calculateScore(dealerHand);

      if (reason === "user_21") {
        userData.balance += betAmount;
        resultMessage = `🎉 Blackjack! You won \`${betAmount} coins\`!`;
      } else if (reason === "bust" || userScore > 21) {
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
          reason === "user_21" || dealerScore > 21 || userScore > dealerScore
            ? 0x22c55e
            : 0xf87171
        );

      await interaction.editReply({ embeds: [resultEmbed], components: [] });

      await logAction(
        interaction.guildId || "",
        {
          user: user.id,
          action: "blackjack",
          amount:
            reason === "user_21" || dealerScore > 21 || userScore > dealerScore
              ? betAmount
              : -betAmount,
          description: `User ${
            reason === "user_21" || dealerScore > 21 || userScore > dealerScore
              ? "won"
              : "lost"
          } ${betAmount} coins in Blackjack.`,
        },
        client
      );
    });
  }

  drawCard(deck: { emoji: string; value: number }[]): {
    emoji: string;
    value: number;
  } {
    return deck.splice(Math.floor(Math.random() * deck.length), 1)[0];
  }

  createDeck() {
    return [
      // Spades
      { emoji: "🂡", value: 11 }, // Ace of Spades
      { emoji: "🂢", value: 2 },
      { emoji: "🂣", value: 3 },
      { emoji: "🂤", value: 4 },
      { emoji: "🂥", value: 5 },
      { emoji: "🂦", value: 6 },
      { emoji: "🂧", value: 7 },
      { emoji: "🂨", value: 8 },
      { emoji: "🂩", value: 9 },
      { emoji: "🂪", value: 10 },
      { emoji: "🂫", value: 10 }, // Jack of Spades
      { emoji: "🂭", value: 10 }, // Queen of Spades
      { emoji: "🂮", value: 10 }, // King of Spades

      // Hearts
      { emoji: "🂱", value: 11 }, // Ace of Hearts
      { emoji: "🂲", value: 2 },
      { emoji: "🂳", value: 3 },
      { emoji: "🂴", value: 4 },
      { emoji: "🂵", value: 5 },
      { emoji: "🂶", value: 6 },
      { emoji: "🂷", value: 7 },
      { emoji: "🂸", value: 8 },
      { emoji: "🂹", value: 9 },
      { emoji: "🂺", value: 10 },
      { emoji: "🂻", value: 10 }, // Jack of Hearts
      { emoji: "🂽", value: 10 }, // Queen of Hearts
      { emoji: "🂾", value: 10 }, // King of Hearts

      // Diamonds
      { emoji: "🃁", value: 11 }, // Ace of Diamonds
      { emoji: "🃂", value: 2 },
      { emoji: "🃃", value: 3 },
      { emoji: "🃄", value: 4 },
      { emoji: "🃅", value: 5 },
      { emoji: "🃆", value: 6 },
      { emoji: "🃇", value: 7 },
      { emoji: "🃈", value: 8 },
      { emoji: "🃉", value: 9 },
      { emoji: "🃊", value: 10 },
      { emoji: "🃋", value: 10 }, // Jack of Diamonds
      { emoji: "🃍", value: 10 }, // Queen of Diamonds
      { emoji: "🃎", value: 10 }, // King of Diamonds

      // Clubs
      { emoji: "🃑", value: 11 }, // Ace of Clubs
      { emoji: "🃒", value: 2 },
      { emoji: "🃓", value: 3 },
      { emoji: "🃔", value: 4 },
      { emoji: "🃕", value: 5 },
      { emoji: "🃖", value: 6 },
      { emoji: "🃗", value: 7 },
      { emoji: "🃘", value: 8 },
      { emoji: "🃙", value: 9 },
      { emoji: "🃚", value: 10 },
      { emoji: "🃛", value: 10 }, // Jack of Clubs
      { emoji: "🃝", value: 10 }, // Queen of Clubs
      { emoji: "🃞", value: 10 }, // King of Clubs
      // Repeat for other suits (Hearts, Diamonds, Clubs)...
    ];
  }
}
