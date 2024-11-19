import { ApplicationCommandRegistry, Command } from "@sapphire/framework";

import { ChatInputCommandInteraction } from "discord.js";
import { ServerSettings } from "../../database/enmap";
import { createEmbed } from "../../utils/embed";
import { hasAdminOrRolePermission } from "../../utils/permissions";
import { logAction } from "../../listeners/events";

export default class EnableEconomyCommand extends Command {
  constructor(context: Command.Context, options: Command.Options) {
    super(context, {
      ...options,
      name: "enableeconomy",
      description: "Enable the economy system for the server.",
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
      economyEnabled: false,
      dailyReward: 100,
    });

    serverSettings.economyEnabled = true;
    ServerSettings.set(interaction.guildId || "", serverSettings);

    const embed = createEmbed({
      title: "Economy Enabled",
      description: "The economy system has been enabled for this server.",
      color: 0x2ecc71,
      timestamp: new Date(),
    });

    await interaction.reply({ embeds: [embed] });

    await logAction(
      interaction.guildId || "",
      {
        action: "enableeconomy",
        admin: interaction.user.id,
        description: "Admin enabled the economy system.",
      },
      interaction.client,
    );

    return;
  }
}
