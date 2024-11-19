import { ApplicationCommandRegistry, Command } from "@sapphire/framework";

import { ChatInputCommandInteraction } from "discord.js";
import { UserData } from "../../database/enmap";
import { createEmbed } from "../../utils/embed";
import { logAction } from "../../listeners/events";

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
              { name: "Tails", value: "tails" }
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
    const choice = interaction.options.getString("choice", true);
    const amount = interaction.options.getInteger("amount", true);
    const userData = UserData.ensure(user.id, { balance: 0 });

    if (amount <= 0 || userData.balance < amount) {
      await interaction.reply({
        content: "❌ Invalid bet amount. Ensure you have enough coins to bet.",
        ephemeral: true,
      });
      return;
    }

    const result = Math.random() < 0.5 ? "heads" : "tails";

    if (result === choice) {
      userData.balance += amount;
      UserData.set(user.id, userData);

      const embed = createEmbed({
        title: "Coin Flip Result",
        fields: [
          { name: "Choice", value: choice, inline: true },
          { name: "Result", value: result, inline: true },
          { name: "Winnings", value: `${amount} coins`, inline: true },
          {
            name: "New Balance",
            value: `${userData.balance} coins`,
            inline: true,
          },
        ],
        color: 0x22c55e,
        timestamp: new Date(),
      });

      await interaction.reply({ embeds: [embed] });
      await logAction(
        interaction.guildId || "",
        {
          user: user.id,
          action: "flipcoin",
          amount,
          description: `User won ${amount} coins in a coin flip (${choice}).`,
        },
        interaction.client
      );
    } else {
      userData.balance -= amount;
      UserData.set(user.id, userData);

      const embed = createEmbed({
        title: "Coin Flip Result",
        fields: [
          { name: "Choice", value: choice, inline: true },
          { name: "Result", value: result, inline: true },
          { name: "Loss", value: `${amount} coins`, inline: true },
          {
            name: "New Balance",
            value: `${userData.balance} coins`,
            inline: true,
          },
        ],
        color: 0xf87171,
        timestamp: new Date(),
      });

      await interaction.reply({ embeds: [embed] });
      await logAction(
        interaction.guildId || "",
        {
          user: user.id,
          action: "flipcoin",
          amount: -amount,
          description: `User lost ${amount} coins in a coin flip (${choice}).`,
        },
        interaction.client
      );
    }
  }
}
