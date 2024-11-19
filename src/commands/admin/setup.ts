import { ApplicationCommandRegistry, Command } from "@sapphire/framework";
import {
  ChannelType,
  ChatInputCommandInteraction,
  PermissionsBitField,
} from "discord.js";

import { ServerSettings } from "../../database/enmap";
import { createEmbed } from "../../utils/embed";

export default class SetupCommand extends Command {
  constructor(context: Command.Context, options: Command.Options) {
    super(context, {
      ...options,
      name: "setup",
      description: "Configure server settings for the bot (admin only).",
    });
  }

  registerApplicationCommands(registry: ApplicationCommandRegistry) {
    registry.registerChatInputCommand((builder) =>
      builder
        .setName(this.name)
        .setDescription(this.description)
        .addStringOption((option) =>
          option
            .setName("action")
            .setDescription("The setup action to perform.")
            .setRequired(true)
            .addChoices(
              { name: "Set Admin Role", value: "admin_role" },
              { name: "Enable Economy", value: "enable_economy" },
              { name: "Disable Economy", value: "disable_economy" },
              { name: "Set Daily Reward", value: "set_daily_reward" },
              { name: "Set Weekly Reward", value: "set_weekly_reward" },
              { name: "Set Modlog Channel", value: "set_modlog_channel" },
              { name: "Set Action Log Channel", value: "set_actionlog_channel" }
            )
        )
        .addStringOption((option) =>
          option
            .setName("value")
            .setDescription(
              "The value to set for the selected action (if applicable)."
            )
        )
    );
  }

  async chatInputRun(interaction: ChatInputCommandInteraction) {
    const user = interaction.user;
    const guildId = interaction.guildId;

    if (
      !interaction.memberPermissions?.has(
        PermissionsBitField.Flags.Administrator
      )
    ) {
      return interaction.reply({
        content:
          "❌ You need to be a server administrator to use this command.",
        ephemeral: true,
      });
    }

    if (!guildId) {
      return interaction.reply({
        content: "❌ This command can only be used in a server.",
        ephemeral: true,
      });
    }

    const action = interaction.options.getString("action", true);
    const value = interaction.options.getString("value") || null;

    const settings = ServerSettings.ensure(guildId, {
      economyEnabled: true,
      dailyReward: 100,
      weeklyReward: 500,
      adminRole: null,
      modlogChannel: null,
      actionlogChannel: null,
    });

    let responseMessage = "";
    let embedColor = 0x22c55e;

    switch (action) {
      case "admin_role":
        if (!value) {
          responseMessage = "❌ Please provide a role name for the admin role.";
          embedColor = 0xf87171;
          break;
        }
        settings.adminRole = value;
        ServerSettings.set(guildId, settings);
        responseMessage = `✅ Admin role has been set to \`${value}\`.`;
        break;

      case "enable_economy":
        settings.economyEnabled = true;
        ServerSettings.set(guildId, settings);
        responseMessage = "✅ Economy system has been enabled for this server.";
        break;

      case "disable_economy":
        settings.economyEnabled = false;
        ServerSettings.set(guildId, settings);
        responseMessage =
          "✅ Economy system has been disabled for this server.";
        break;

      case "set_daily_reward":
        const dailyReward = parseInt(value || "", 10);
        if (isNaN(dailyReward) || dailyReward <= 0) {
          responseMessage =
            "❌ Please provide a valid positive number for the daily reward.";
          embedColor = 0xf87171;
          break;
        }
        settings.dailyReward = dailyReward;
        ServerSettings.set(guildId, settings);
        responseMessage = `✅ Daily reward has been set to \`${dailyReward} coins\`.`;
        break;

      case "set_weekly_reward":
        const weeklyReward = parseInt(value || "", 10);
        if (isNaN(weeklyReward) || weeklyReward <= 0) {
          responseMessage =
            "❌ Please provide a valid positive number for the weekly reward.";
          embedColor = 0xf87171;
          break;
        }
        settings.weeklyReward = weeklyReward;
        ServerSettings.set(guildId, settings);
        responseMessage = `✅ Weekly reward has been set to \`${weeklyReward} coins\`.`;
        break;

      case "set_modlog_channel":
        const modlogChannel = interaction.guild?.channels.cache.find(
          (channel) => channel.name === value || channel.id === value
        );
        if (!modlogChannel || modlogChannel.type !== ChannelType.GuildText) {
          responseMessage =
            "❌ Please provide a valid text channel name or ID for the modlog.";
          embedColor = 0xf87171;
          break;
        }
        settings.modlogChannel = modlogChannel.id;
        ServerSettings.set(guildId, settings);
        responseMessage = `✅ Modlog channel has been set to <#${modlogChannel.id}>.`;
        break;

      case "set_actionlog_channel":
        const actionlogChannel = interaction.guild?.channels.cache.find(
          (channel) => channel.name === value || channel.id === value
        );
        if (
          !actionlogChannel ||
          actionlogChannel.type !== ChannelType.GuildText
        ) {
          responseMessage =
            "❌ Please provide a valid text channel name or ID for the action log.";
          embedColor = 0xf87171;
          break;
        }
        settings.actionlogChannel = actionlogChannel.id;
        ServerSettings.set(guildId, settings);
        responseMessage = `✅ Action log channel has been set to <#${actionlogChannel.id}>.`;
        break;

      default:
        responseMessage = "❌ Invalid action. Please select a valid option.";
        embedColor = 0xf87171;
        break;
    }

    const embed = createEmbed({
      title: "Setup Result",
      description: responseMessage,
      color: embedColor,
      timestamp: new Date(),
    });

    return interaction.reply({ embeds: [embed] });
  }
}
