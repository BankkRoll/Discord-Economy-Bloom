import { ApplicationCommandRegistry, Command } from "@sapphire/framework";

import { ChatInputCommandInteraction } from "discord.js";
import { UserData } from "../../database/enmap.js";
import { createEmbed } from "../../utils/embed.js";
import { logAction } from "../../utils/events.js";
import { hasAdminOrRolePermission } from "../../utils/permissions.js";

export default class RemoveCoinsCommand extends Command {
  constructor(context: Command.Context, options: Command.Options) {
    super(context, {
      ...options,
      name: "removecoins",
      description: "Remove coins from a user's balance.",
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
            .setDescription("The user to remove coins from.")
            .setRequired(true),
        )
        .addIntegerOption((option) =>
          option
            .setName("amount")
            .setDescription("The amount of coins to remove.")
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

    const userData = UserData.ensure(user.id, { balance: 0 });
    if (userData.balance < amount) {
      return interaction.reply({
        content: `❌ The user does not have enough coins to remove.`,
        ephemeral: true,
      });
    }

    // Remove Coins
    userData.balance -= amount;
    UserData.set(user.id, userData);

    // Create Embed for Interaction Reply
    const embed = createEmbed({
      title: "Coins Removed",
      fields: [
        { name: "User", value: `<@${user.id}>`, inline: true },
        { name: "Amount", value: `${amount}`, inline: true },
        {
          name: "Remaining Balance",
          value: `${userData.balance}`,
          inline: true,
        },
      ],
      color: 0xff5555,
      timestamp: new Date(),
    });

    await interaction.reply({ embeds: [embed] });

    // Log the Action
    await logAction(
      interaction.guildId || "",
      {
        user: user.id,
        action: "removecoins",
        amount,
        admin: interaction.user.id,
        description: `Admin removed ${amount} coins from the user.`,
      },
      interaction.client,
    );

    return;
  }
}
