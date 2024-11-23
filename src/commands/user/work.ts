import { ApplicationCommandRegistry, Command } from "@sapphire/framework";

import { ChatInputCommandInteraction } from "discord.js";
import { UserData } from "../../database/enmap.js";
import { createEmbed } from "../../utils/embed.js";
import { logAction } from "../../utils/events.js";

export default class WorkCommand extends Command {
  constructor(context: Command.Context, options: Command.Options) {
    super(context, {
      ...options,
      name: "work",
      description: "Earn coins by completing a random work task.",
    });
  }

  registerApplicationCommands(registry: ApplicationCommandRegistry) {
    registry.registerChatInputCommand((builder) =>
      builder.setName(this.name).setDescription(this.description)
    );
  }

  async chatInputRun(interaction: ChatInputCommandInteraction) {
    const user = interaction.user;
    const userData = UserData.ensure(user.id, { balance: 0, cooldowns: {} });

    const lastWorked = new Date(userData.cooldowns.work || 0);
    const now = new Date();
    const cooldown = 60 * 60 * 1000;
    const nextWorkTime = lastWorked.getTime() + cooldown;

    if (now.getTime() < nextWorkTime) {
      await interaction.reply({
        content: `❌ You've already worked recently. You can work again <t:${Math.floor(nextWorkTime / 1000)}:R>.`,
        ephemeral: true,
      });
      return;
    }

    const jobs = [
      { job: "Flipping burgers 🍔", min: 10, max: 50, chance: 40 },
      { job: "Hacking the Pentagon 💻", min: 500, max: 1000, chance: 2 },
      { job: "Walking dogs 🐕", min: 20, max: 100, chance: 25 },
      { job: "Being a clown 🤡", min: 5, max: 30, chance: 15 },
      { job: "Rocket scientist 🚀", min: 200, max: 500, chance: 5 },
      { job: "Selling lemonade 🍋", min: 10, max: 50, chance: 30 },
      { job: "Mining Bitcoin 🪙", min: 100, max: 300, chance: 10 },
      { job: "Comedy club performance 🎤", min: 50, max: 150, chance: 15 },
      { job: "Fortune teller 🔮", min: 20, max: 80, chance: 20 },
      { job: "Pizza delivery 🍕", min: 30, max: 70, chance: 30 },
      { job: "Street musician 🎸", min: 15, max: 60, chance: 25 },
      { job: "Fishing 🎣", min: 40, max: 120, chance: 20 },
      { job: "Lawn mowing 🌱", min: 25, max: 90, chance: 30 },
      { job: "Garbage collector 🗑️", min: 30, max: 100, chance: 25 },
      { job: "Freelance artist 🎨", min: 40, max: 150, chance: 15 },
      { job: "Online tutor 📚", min: 50, max: 200, chance: 10 },
      { job: "Riding a unicorn 🦄", min: 5, max: 10, chance: 2 },
      { job: "Alien research assistant 👽", min: 300, max: 800, chance: 3 },
      { job: "Gold miner ⛏️", min: 100, max: 300, chance: 10 },
      { job: "Treasure hunter 🏴‍☠️", min: 200, max: 1000, chance: 5 },
      { job: "Farmhand 🌾", min: 30, max: 120, chance: 25 },
      { job: "Astronaut 🧑‍🚀", min: 500, max: 1500, chance: 1 },
      { job: "Game tester 🎮", min: 40, max: 100, chance: 20 },
      { job: "Retail cashier 🛒", min: 20, max: 80, chance: 30 },
      { job: "Chef 👨‍🍳", min: 100, max: 400, chance: 10 },
      { job: "Stand-up comedian 🎤", min: 50, max: 200, chance: 15 },
      { job: "Building Lego sets 🧱", min: 20, max: 60, chance: 30 },
      { job: "Private detective 🕵️", min: 150, max: 400, chance: 5 },
      { job: "Zoo cleaner 🦍", min: 30, max: 70, chance: 30 },
      { job: "Taxi driver 🚕", min: 50, max: 150, chance: 20 },
      { job: "Hotdog vendor 🌭", min: 25, max: 90, chance: 25 },
      { job: "YouTuber 🎥", min: 50, max: 300, chance: 10 },
      { job: "Photographer 📸", min: 40, max: 200, chance: 15 },
      { job: "Auctioneer 🛎️", min: 200, max: 800, chance: 5 },
      { job: "Toy tester 🧸", min: 20, max: 70, chance: 25 },
      { job: "Santa Claus 🎅", min: 50, max: 200, chance: 10 },
      { job: "Repairing robots 🤖", min: 150, max: 500, chance: 8 },
      { job: "Shoveling snow ❄️", min: 30, max: 100, chance: 25 },
      { job: "Alien diplomat 👾", min: 500, max: 2000, chance: 1 },
      { job: "Luxury yacht captain 🛥️", min: 300, max: 1000, chance: 3 },
      { job: "Writing novels 📖", min: 100, max: 400, chance: 10 },
      { job: "Treasure diver 🤿", min: 200, max: 600, chance: 5 },
      { job: "Extreme sports instructor 🪂", min: 150, max: 400, chance: 10 },
      { job: "Painting fences 🎨", min: 20, max: 80, chance: 30 },
      { job: "Babysitting 👶", min: 30, max: 100, chance: 20 },
      { job: "Spy on a mission 🕶️", min: 300, max: 800, chance: 4 },
      { job: "Sculptor 🗿", min: 50, max: 250, chance: 12 },
      { job: "Juggling 🔴", min: 10, max: 50, chance: 25 },
      { job: "Pilot ✈️", min: 500, max: 1200, chance: 3 },
    ];

    const getRandomJob = () => {
      const weightedJobs = jobs.flatMap((job) => Array(job.chance).fill(job));
      return weightedJobs[Math.floor(Math.random() * weightedJobs.length)];
    };

    const selectedJob = getRandomJob();
    const earnings =
      Math.floor(Math.random() * (selectedJob.max - selectedJob.min + 1)) +
      selectedJob.min;

    userData.balance += earnings;
    userData.cooldowns.work = now.toISOString();
    UserData.set(user.id, userData);

    const embed = createEmbed({
      title: "Work Completed",
      description: `💼 **Job**: ${selectedJob.job}\n\n🎉 **Earnings**: \`${earnings} coins\``,
      fields: [
        { name: "Job", value: selectedJob.job, inline: true },
        { name: "Earnings", value: `${earnings} coins`, inline: true },
        {
          name: "New Balance",
          value: `${userData.balance} coins`,
          inline: true,
        },
      ],
      color: 0x22c55e,
      timestamp: new Date(),
    });

    await interaction.reply({ embeds: [embed] });

    await logAction(
      interaction.guildId || "",
      {
        user: user.id,
        action: "work",
        amount: earnings,
        description: `User completed '${selectedJob.job}' and earned ${earnings} coins.`,
      },
      interaction.client
    );
  }
}
