import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChatInputCommandInteraction,
  ComponentType,
} from "discord.js";
import { ApplicationCommandRegistry, Command } from "@sapphire/framework";

import { UserData } from "../../database/enmap";
import { createEmbed } from "../../utils/embed";
import { logAction } from "../../listeners/events";

export default class LotteryTicketCommand extends Command {
  constructor(context: Command.Context, options: Command.Options) {
    super(context, {
      ...options,
      name: "lottery-ticket",
      description: "Buy a lottery ticket and try your luck.",
    });
  }

  registerApplicationCommands(registry: ApplicationCommandRegistry) {
    registry.registerChatInputCommand((builder) =>
      builder.setName(this.name).setDescription(this.description)
    );
  }

  async chatInputRun(interaction: ChatInputCommandInteraction) {
    const user = interaction.user;
    const userData = UserData.ensure(user.id, { balance: 0 });

    const tickets = [
      { name: "Bronze Ticket", price: 5, chances: [0.75, 0.2, 0.05], prizes: [0, 10, 25] },
      { name: "Silver Ticket", price: 10, chances: [0.6, 0.3, 0.1], prizes: [0, 20, 50] },
      { name: "Gold Ticket", price: 25, chances: [0.5, 0.35, 0.15], prizes: [0, 50, 100] },
      { name: "Platinum Ticket", price: 50, chances: [0.4, 0.4, 0.2], prizes: [0, 100, 250] },
      { name: "Diamond Ticket", price: 100, chances: [0.3, 0.5, 0.2], prizes: [0, 250, 500] },
    ];

    const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      tickets.map((ticket) =>
        new ButtonBuilder()
          .setCustomId(ticket.name)
          .setLabel(`${ticket.name} - ${ticket.price} coins`)
          .setStyle(ButtonStyle.Primary)
      )
    );

    await interaction.reply({
      content: "🎟️ Select a lottery ticket to purchase:",
      components: [actionRow],
    });

    const collector = interaction.channel?.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 30000,
    });

    collector?.on("collect", async (buttonInteraction) => {
      if (buttonInteraction.user.id !== user.id) {
        await buttonInteraction.reply({ content: "This is not your lottery!", ephemeral: true });
        return;
      }

      const selectedTicket = tickets.find((t) => t.name === buttonInteraction.customId);
      if (!selectedTicket) {
        await buttonInteraction.reply({ content: "Invalid ticket selected.", ephemeral: true });
        return;
      }

      if (userData.balance < selectedTicket.price) {
        await buttonInteraction.reply({
          content: `❌ You don't have enough coins to buy a **${selectedTicket.name}**.`,
          ephemeral: true,
        });
        return;
      }

      userData.balance -= selectedTicket.price;

      const random = Math.random();
      let prize = 0;
      for (let i = 0; i < selectedTicket.chances.length; i++) {
        if (random <= selectedTicket.chances[i]) {
          prize = selectedTicket.prizes[i];
          break;
        }
      }

      userData.balance += prize;
      UserData.set(user.id, userData);

      const embed = createEmbed({
        title: "Lottery Result",
        fields: [
          { name: "Ticket Type", value: selectedTicket.name, inline: true },
          { name: "Ticket Price", value: `${selectedTicket.price} coins`, inline: true },
          { name: "Prize", value: `${prize} coins`, inline: true },
          { name: "New Balance", value: `${userData.balance} coins`, inline: true },
        ],
        color: prize > 0 ? 0x22c55e : 0xf87171,
        timestamp: new Date(),
      });

      await buttonInteraction.update({ content: null, embeds: [embed], components: [] });

      await logAction(
        interaction.guildId || "",
        {
          user: user.id,
          action: "lottery-ticket",
          amount: prize - selectedTicket.price,
          description: prize > 0
            ? `User won ${prize} coins with a ${selectedTicket.name}.`
            : `User lost ${selectedTicket.price} coins with a ${selectedTicket.name}.`,
        },
        interaction.client
      );
    });

    collector?.on("end", async (_, reason) => {
      if (reason === "time") {
        await interaction.followUp({
          content: "⏰ Time's up! You didn't select a ticket.",
          ephemeral: true,
        });
      }
    });
  }
}
