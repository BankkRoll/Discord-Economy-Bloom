import {
  ActionRowBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  ModalBuilder,
  ModalSubmitInteraction,
  PermissionsBitField,
  StringSelectMenuBuilder,
  TextInputBuilder,
  TextInputStyle,
} from "discord.js";
import { ApplicationCommandRegistry, Command } from "@sapphire/framework";

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
      builder.setName(this.name).setDescription(this.description),
    );
  }

  async chatInputRun(interaction: ChatInputCommandInteraction) {
    if (
      !interaction.memberPermissions?.has(
        PermissionsBitField.Flags.Administrator,
      )
    ) {
      await interaction.reply({
        content: "❌ You need administrator permissions to use this command.",
        ephemeral: true,
      });
      return;
    }

    const guildId = interaction.guildId;
    if (!guildId) {
      await interaction.reply({
        content: "❌ This command can only be used in a server.",
        ephemeral: true,
      });
      return;
    }

    const settings = ServerSettings.ensure(guildId, {
      dailyReward: 100,
      weeklyReward: 500,
      adminRole: null,
      modlogChannel: null,
    });

    const embed = this.createSetupEmbed(settings);
    const dropdown = this.createDropdownMenu();

    const actionRow =
      new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(dropdown);

    const originalMessage = await interaction.reply({
      embeds: [embed],
      components: [actionRow],
      fetchReply: true,
    });

    const collector = interaction.channel?.createMessageComponentCollector({
      filter: (i) => i.user.id === interaction.user.id,
      time: 300000,
    });

    collector?.on("collect", async (componentInteraction) => {
      if (!componentInteraction.isStringSelectMenu()) return;

      const selected = componentInteraction.values[0];

      if (selected === "modlogChannel") {
        await this.promptForChannel(
          componentInteraction,
          settings,
          "modlogChannel",
          originalMessage,
        );
      } else if (selected === "adminRole") {
        await this.promptForRole(
          componentInteraction,
          settings,
          "adminRole",
          originalMessage,
        );
      } else if (selected === "dailyReward" || selected === "weeklyReward") {
        await this.showRewardModal(
          componentInteraction,
          selected,
          settings,
          originalMessage,
        );
      }
    });

    collector?.on("end", async (_, reason) => {
      if (reason === "time") {
        await originalMessage.edit({
          content: "⏰ Setup timed out! Please run `/setup` again.",
          components: [],
        });
      }
    });
  }

  createSetupEmbed(settings: any) {
    return new EmbedBuilder()
      .setTitle("Server Setup")
      .setDescription(
        "Use the dropdown menu below to select a setting to configure.",
      )
      .addFields(
        {
          name: "📝 Modlog Channel",
          value: settings.modlogChannel
            ? `<#${settings.modlogChannel}>`
            : "Not Set",
          inline: true,
        },
        {
          name: "👮 Admin Role",
          value: settings.adminRole ? `<@&${settings.adminRole}>` : "Not Set",
          inline: true,
        },
        {
          name: "💰 Daily Reward",
          value: `${settings.dailyReward} coins`,
          inline: true,
        },
        {
          name: "📅 Weekly Reward",
          value: `${settings.weeklyReward} coins`,
          inline: true,
        },
      )
      .setColor(0x3498db)
      .setTimestamp();
  }

  createDropdownMenu() {
    return new StringSelectMenuBuilder()
      .setCustomId("setup_dropdown")
      .setPlaceholder("Select a setting to edit...")
      .addOptions(
        {
          label: "Modlog Channel",
          description: "Set the mod log channel.",
          value: "modlogChannel",
        },
        {
          label: "Admin Role",
          description: "Set the admin role.",
          value: "adminRole",
        },
        {
          label: "Daily Reward",
          description: "Set the daily reward amount.",
          value: "dailyReward",
        },
        {
          label: "Weekly Reward",
          description: "Set the weekly reward amount.",
          value: "weeklyReward",
        },
      );
  }

  async promptForChannel(
    interaction: any,
    settings: any,
    key: string,
    originalMessage: any,
  ) {
    await interaction.reply({
      content: `📢 Please mention the channel to set as your ${key === "modlogChannel" ? "mod log" : key}.`,
      ephemeral: true,
    });

    const channelCollector = interaction.channel?.createMessageCollector({
      filter: (m: any) => m.author.id === interaction.user.id,
      time: 60000,
    });

    channelCollector?.on("collect", async (msg: any) => {
      const channel = msg.mentions.channels.first();
      if (channel && channel.isTextBased()) {
        settings[key] = channel.id;
        ServerSettings.set(interaction.guildId!, settings);

        await originalMessage.edit({
          embeds: [this.createSetupEmbed(settings)],
        });
        await msg.delete();
        channelCollector.stop();
      } else {
        await msg.reply("❌ Please mention a valid text channel.");
      }
    });

    channelCollector?.on("end", (_: any, reason: any) => {
      if (reason === "time") {
        interaction.editReply("❌ Channel setup timed out.");
      }
    });
  }

  async promptForRole(
    interaction: any,
    settings: any,
    key: string,
    originalMessage: any,
  ) {
    await interaction.reply({
      content: "👮 Please mention the role to set as your admin role.",
      ephemeral: true,
    });

    const roleCollector = interaction.channel?.createMessageCollector({
      filter: (m: any) => m.author.id === interaction.user.id,
      time: 60000,
    });

    roleCollector?.on("collect", async (msg: any) => {
      const role = msg.mentions.roles.first();
      if (role) {
        settings[key] = role.id;
        ServerSettings.set(interaction.guildId!, settings);

        await originalMessage.edit({
          embeds: [this.createSetupEmbed(settings)],
        });
        await msg.delete();
        roleCollector.stop();
      } else {
        await msg.reply("❌ Please mention a valid role.");
      }
    });

    roleCollector?.on("end", (_: any, reason: string) => {
      if (reason === "time") {
        interaction.editReply("❌ Role setup timed out.");
      }
    });
  }

  async showRewardModal(
    interaction: any,
    key: string,
    settings: any,
    originalMessage: any,
  ) {
    const modal = new ModalBuilder()
      .setCustomId(`setup_${key}`)
      .setTitle(
        `Edit ${key === "dailyReward" ? "Daily Reward" : "Weekly Reward"}`,
      );

    const rewardInput = new TextInputBuilder()
      .setCustomId("reward_amount")
      .setLabel(
        `Enter the new ${key === "dailyReward" ? "daily" : "weekly"} reward.`,
      )
      .setStyle(TextInputStyle.Short)
      .setPlaceholder(`Currently set to ${settings[key]} coins`)
      .setRequired(true);

    const actionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(
      rewardInput,
    );

    modal.addComponents(actionRow);

    await interaction.showModal(modal);

    interaction
      .awaitModalSubmit({ time: 60000 }) // 1-minute timeout
      .then(async (modalInteraction: ModalSubmitInteraction) => {
        const amount = parseInt(
          modalInteraction.fields.getTextInputValue("reward_amount"),
        );
        if (!isNaN(amount) && amount > 0) {
          settings[key] = amount;
          ServerSettings.set(interaction.guildId!, settings);

          await modalInteraction.reply({
            content: `✅ ${key === "dailyReward" ? "Daily reward" : "Weekly reward"} updated successfully!`,
            ephemeral: true,
          });

          await originalMessage.edit({
            embeds: [this.createSetupEmbed(settings)],
          });
        } else {
          await modalInteraction.reply({
            content: "❌ Please enter a valid positive number.",
            ephemeral: true,
          });
        }
      })
      .catch(() => {
        interaction.followUp({
          content: "❌ Modal submission timed out.",
          ephemeral: true,
        });
      });
  }
}
