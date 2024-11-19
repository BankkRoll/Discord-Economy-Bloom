import { ApplicationCommandRegistry, Command } from "@sapphire/framework";

import { ChatInputCommandInteraction } from "discord.js";
import { UserData } from "../../database/enmap";
import { createEmbed } from "../../utils/embed";
import { hasAdminOrRolePermission } from "../../utils/permissions";
import { logAction } from "../../listeners/events";

export default class AddCoinsCommand extends Command {
  constructor(context: Command.Context, options: Command.Options) {
    super(context, {
      ...options,
      name: "addcoins",
      description: "Add coins to a user's balance.",
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
            .setDescription("The user to give coins to.")
            .setRequired(true),
        )
        .addIntegerOption((option) =>
          option
            .setName("amount")
            .setDescription("The amount of coins to add.")
            .setRequired(true),
        ),
    );
  }

  async chatInputRun(interaction: ChatInputCommandInteraction) {
    const user = interaction.options.getUser("user", true);
    const amount = interaction.options.getInteger("amount", true);

    // Permission Check
    const member = interaction.guild?.members.cache.get(interaction.user.id);
    if (!hasAdminOrRolePermission(member, interaction.guildId)) {
      return interaction.reply({
        content: `❌ You do not have permission to use this command.`,
        ephemeral: true,
      });
    }

    if (amount <= 0) {
      return interaction.reply({
        content: `❌ The amount must be a positive integer.`,
        ephemeral: true,
      });
    }

    // Add Coins
    const userData = UserData.ensure(user.id, { balance: 0 });
    userData.balance += amount;
    UserData.set(user.id, userData);

    // Create Embed for Interaction Reply
    const embed = createEmbed({
      title: "Coins Added",
      fields: [
        { name: "User", value: `<@${user.id}>`, inline: true },
        { name: "Amount", value: `${amount}`, inline: true },
        { name: "New Balance", value: `${userData.balance}`, inline: true },
      ],
      color: 0x22c55e,
      timestamp: new Date(),
    });

    await interaction.reply({ embeds: [embed] });

    // Log the Action
    await logAction(
      interaction.guildId || "",
      {
        user: user.id,
        action: "addcoins",
        amount,
        admin: interaction.user.id,
        description: `Admin added ${amount} coins to the user.`,
      },
      interaction.client,
    );

    return;
  }
}
