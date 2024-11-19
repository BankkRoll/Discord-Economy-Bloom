import { ApplicationCommandRegistry, Command } from "@sapphire/framework";

import { ChatInputCommandInteraction } from "discord.js";
import { ServerSettings } from "../../database/enmap";
import { createEmbed } from "../../utils/embed";
import { hasAdminOrRolePermission } from "../../utils/permissions";
import { logAction } from "../../listeners/events";

export default class DisableEconomyCommand extends Command {
  constructor(context: Command.Context, options: Command.Options) {
    super(context, {
      ...options,
      name: "disableeconomy",
      description: "Disable the economy system for the server.",
    });
  }

  registerApplicationCommands(registry: ApplicationCommandRegistry) {
    registry.registerChatInputCommand((builder) =>
      builder.setName(this.name).setDescription(this.description),
    );
  }

  async chatInputRun(interaction: ChatInputCommandInteraction) {
    const member = interaction.guild?.members.cache.get(interaction.user.id);
    if (!hasAdminOrRolePermission(member, interaction.guildId)) {
      await interaction.reply({
        content: `❌ You do not have permission to use this command.`,
        ephemeral: true,
      });
      return;
    }

    const serverSettings = ServerSettings.ensure(interaction.guildId || "", {
      economyEnabled: true,
      dailyReward: 100,
    });

    serverSettings.economyEnabled = false;
    ServerSettings.set(interaction.guildId || "", serverSettings);

    const embed = createEmbed({
      title: "Economy Disabled",
      description: "The economy system has been disabled for this server.",
      color: 0xe74c3c,
      timestamp: new Date(),
    });

    await interaction.reply({ embeds: [embed] });

    await logAction(
      interaction.guildId || "",
      {
        action: "disableeconomy",
        admin: interaction.user.id,
        description: "Admin disabled the economy system.",
      },
      interaction.client,
    );

    return;
  }
}
