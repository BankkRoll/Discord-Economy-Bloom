import { ApplicationCommandRegistry, Command } from "@sapphire/framework";

import { ChatInputCommandInteraction } from "discord.js";
import { UserData } from "../../database/enmap";
import { createEmbed } from "../../utils/embed";
import { hasAdminOrRolePermission } from "../../utils/permissions";
import { logAction } from "../../listeners/events";

export default class SetCoinsCommand extends Command {
  constructor(context: Command.Context, options: Command.Options) {
    super(context, {
      ...options,
      name: "setcoins",
      description: "Set a user's balance to a specific amount.",
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
            .setDescription("The user whose balance to set.")
            .setRequired(true),
        )
        .addIntegerOption((option) =>
          option
            .setName("amount")
            .setDescription("The new balance amount.")
            .setRequired(true),
        ),
    );
  }

  async chatInputRun(interaction: ChatInputCommandInteraction) {
    const user = interaction.options.getUser("user", true);
    const amount = interaction.options.getInteger("amount", true);

    const member = interaction.guild?.members.cache.get(interaction.user.id);
    if (!hasAdminOrRolePermission(member, interaction.guildId)) {
      return interaction.reply({
        content: `❌ You do not have permission to use this command.`,
        ephemeral: true,
      });
    }

    if (amount < 0) {
      return interaction.reply({
        content: `❌ The balance must be a non-negative integer.`,
        ephemeral: true,
      });
    }

    // Set Coins
    const userData = UserData.ensure(user.id, { balance: 0 });
    userData.balance = amount;
    UserData.set(user.id, userData);

    // Create Embed for Interaction Reply
    const embed = createEmbed({
      title: "Balance Updated",
      fields: [
        { name: "User", value: `<@${user.id}>`, inline: true },
        { name: "New Balance", value: `${amount}`, inline: true },
      ],
      color: 0x2ecc71,
      timestamp: new Date(),
    });

    await interaction.reply({ embeds: [embed] });

    // Log the Action
    await logAction(
      interaction.guildId || "",
      {
        user: user.id,
        action: "setcoins",
        amount,
        admin: interaction.user.id,
        description: `Admin set the user's balance to ${amount} coins.`,
      },
      interaction.client,
    );

    return;
  }
}
