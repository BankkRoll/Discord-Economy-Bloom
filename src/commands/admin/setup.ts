import { ApplicationCommandRegistry, Command } from "@sapphire/framework";
import {
  ChannelType,
  ChatInputCommandInteraction,
  PermissionsBitField,
} from "discord.js";

import { ServerSettings } from "../../database/enmap.js";

export default class SetupCommand extends Command {
  constructor(context: Command.Context, options: Command.Options) {
    super(context, {
      ...options,
      name: "setup",
      description: "Interactive server setup for bot configuration.",
    });
  }

  registerApplicationCommands(registry: ApplicationCommandRegistry) {
    registry.registerChatInputCommand((builder) =>
      builder.setName(this.name).setDescription(this.description)
    );
  }

  async chatInputRun(interaction: ChatInputCommandInteraction): Promise<void> {
    const guildId = interaction.guildId;

    if (
      !interaction.memberPermissions?.has(
        PermissionsBitField.Flags.Administrator
      )
    ) {
      await interaction.reply({
        content:
          "❌ You need to be a server administrator to use this command.",
        ephemeral: true,
      });
      return;
    }

    if (!guildId) {
      await interaction.reply({
        content: "❌ This command can only be used in a server.",
        ephemeral: true,
      });
      return;
    }

    // Ensure default server settings
    const settings = ServerSettings.ensure(guildId, {
      dailyReward: 100,
      weeklyReward: 500,
      adminRole: null,
      modlogChannel: null,
    });

    const steps = [
      {
        key: "modlogChannel",
        question:
          "What channel should mod logs be sent to? Please tag the channel below.",
      },
      {
        key: "adminRole",
        question:
          "What role should have admin privileges? Please tag the role below.",
      },
      {
        key: "dailyReward",
        question:
          "What should the daily reward amount be? Please provide a positive number.",
      },
      {
        key: "weeklyReward",
        question:
          "What should the weekly reward amount be? Please provide a positive number.",
      },
    ];

    let currentStep = 0;

    const createSetupEmbed = () => {
      return {
        title: "Server Setup",
        description: "Follow the steps below to configure the bot settings.",
        fields: [
          {
            name: "Modlog Channel",
            value: settings.modlogChannel
              ? `<#${settings.modlogChannel}>`
              : "Not Set",
            inline: true,
          },
          {
            name: "Admin Role",
            value: settings.adminRole ? `<@&${settings.adminRole}>` : "Not Set",
            inline: true,
          },
          {
            name: "Daily Reward",
            value: `${settings.dailyReward} coins`,
            inline: true,
          },
          {
            name: "Weekly Reward",
            value: `${settings.weeklyReward} coins`,
            inline: true,
          },
        ],
        footer: { text: `Step ${currentStep + 1} of ${steps.length}` },
      };
    };

    const promptNextStep = async () => {
      const step = steps[currentStep];
      await interaction.editReply({
        embeds: [{ ...createSetupEmbed(), color: 0x3498db }],
        content: step.question,
      });
    };

    await interaction.reply({
      embeds: [{ ...createSetupEmbed(), color: 0x3498db }],
      content: steps[currentStep].question,
      fetchReply: true,
    });

    const messageCollector = interaction.channel?.createMessageCollector({
      filter: (m) => m.author.id === interaction.user.id,
      time: 120000,
    });

    messageCollector?.on("collect", async (message) => {
      const step = steps[currentStep];
      let validInput = false;

      if (step.key === "modlogChannel") {
        const channel = message.mentions.channels.first();
        if (channel && channel.type === ChannelType.GuildText) {
          settings[step.key] = channel.id;
          validInput = true;
        } else {
          await message.reply("❌ Please mention a valid text channel.");
        }
      } else if (step.key === "adminRole") {
        const role = message.mentions.roles.first();
        if (role) {
          settings.adminRole = role.id;
          validInput = true;
        } else {
          await message.reply("❌ Please mention a valid role.");
        }
      } else if (step.key === "dailyReward" || step.key === "weeklyReward") {
        const amount = parseInt(message.content, 10);
        if (!isNaN(amount) && amount > 0) {
          settings[step.key] = amount;
          validInput = true;
        } else {
          await message.reply("❌ Please provide a valid positive number.");
        }
      }

      if (validInput) {
        await message.delete();
        ServerSettings.set(guildId, settings);
        currentStep++;

        if (currentStep < steps.length) {
          await promptNextStep();
        } else {
          messageCollector.stop("completed");
        }
      }
    });

    messageCollector?.on("end", async (_, reason) => {
      if (reason === "time") {
        await interaction.editReply({
          content:
            "⏰ Setup timed out! Please run `/setup` again to complete the configuration.",
          embeds: [],
        });
        return;
      }

      if (reason === "completed") {
        await interaction.editReply({
          content:
            "✅ Setup completed successfully! Here are your server settings:",
          embeds: [{ ...createSetupEmbed(), color: 0x22c55e }],
        });
        return;
      }
    });
  }
}
