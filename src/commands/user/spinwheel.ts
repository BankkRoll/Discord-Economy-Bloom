import { ApplicationCommandRegistry, Command } from "@sapphire/framework";

import { ChatInputCommandInteraction } from "discord.js";
import { UserData } from "../../database/enmap";
import { createEmbed } from "../../utils/embed";
import { logAction } from "../../listeners/events";

export default class SpinWheelCommand extends Command {
  constructor(context: Command.Context, options: Command.Options) {
    super(context, {
      ...options,
      name: "spinwheel",
      description: "Spin the wheel for random rewards.",
    });
  }

  registerApplicationCommands(registry: ApplicationCommandRegistry) {
    registry.registerChatInputCommand((builder) =>
      builder
        .setName(this.name)
        .setDescription(this.description)
        .addIntegerOption((option) =>
          option
            .setName("amount")
            .setDescription("The amount of coins to spend on the spin.")
            .setRequired(true)
        )
    );
  }

  async chatInputRun(interaction: ChatInputCommandInteraction) {
    const user = interaction.user;
    const spinCost = interaction.options.getInteger("amount", true);
    const userData = UserData.ensure(user.id, { balance: 0 });

    if (spinCost <= 0 || userData.balance < spinCost) {
      await interaction.reply({
        content: "❌ Invalid spin cost. Ensure you have enough coins.",
        ephemeral: true,
      });
      return;
    }

    userData.balance -= spinCost;

    const rewards = [
      { reward: "100 coins", value: 100 },
      { reward: "50 coins", value: 50 },
      { reward: `Double your spin cost`, value: spinCost * 2 },
      { reward: "No reward", value: 0 },
    ];

    const result = rewards[Math.floor(Math.random() * rewards.length)];
    userData.balance += result.value;
    UserData.set(user.id, userData);

    const embed = createEmbed({
      title: "Spin Wheel Result",
      fields: [
        { name: "Spin Cost", value: `${spinCost} coins`, inline: true },
        { name: "Reward", value: result.reward, inline: true },
        {
          name: "New Balance",
          value: `${userData.balance} coins`,
          inline: true,
        },
      ],
      color: result.value > 0 ? 0x22c55e : 0xf87171,
      timestamp: new Date(),
    });

    await interaction.reply({ embeds: [embed] });

    await logAction(
      interaction.guildId || "",
      {
        user: user.id,
        action: "spinwheel",
        amount: result.value - spinCost,
        description: `User spun the wheel for ${spinCost} coins and won ${result.reward}.`,
      },
      interaction.client
    );
  }
}
