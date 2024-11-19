import { ApplicationCommandRegistry, Command } from "@sapphire/framework";

import { ChatInputCommandInteraction } from "discord.js";
import { UserData } from "../../database/enmap";
import { createEmbed } from "../../utils/embed";

export default class BalanceCommand extends Command {
  constructor(context: Command.Context, options: Command.Options) {
    super(context, {
      ...options,
      name: "balance",
      description: "Check your balance or another user's balance.",
    });
  }

  registerApplicationCommands(registry: ApplicationCommandRegistry) {
    registry.registerChatInputCommand((builder) =>
      builder
        .setName(this.name)
        .setDescription(this.description)
        .addUserOption((option) =>
          option
            .setName("user")
            .setDescription("The user to check balance for.")
        )
    );
  }

  async chatInputRun(interaction: ChatInputCommandInteraction) {
    try {
      const user = interaction.options.getUser("user") || interaction.user;

      const userData = UserData.ensure(user.id, { balance: 0 });

      const embed = createEmbed({
        title: `${user.username}'s Balance`,
        fields: [
          {
            name: "💰 Balance",
            value: `${userData.balance} coins`,
            inline: true,
          },
        ],
        color: 0x22c55e,
        timestamp: new Date(),
      });

      await interaction.reply({ embeds: [embed] });

      return;
    } catch (error) {
      console.error("Error in BalanceCommand:", error);

      await interaction.reply({
        content: "❌ An error occurred while retrieving the balance.",
        ephemeral: true,
      });

      return;
    }
  }
}
