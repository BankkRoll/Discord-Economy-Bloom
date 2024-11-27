// src\index.ts
import "dotenv/config";

import { ActivityType, GatewayIntentBits } from "discord.js";

import { Logger } from "./utils/logger.js";
import { SapphireClient } from "@sapphire/framework";
import fs from "fs";
import path from "path";

const dataFolderPath = path.resolve("./data");

if (!fs.existsSync(dataFolderPath)) {
  fs.mkdirSync(dataFolderPath);
  Logger.info(`Created missing directory: ${dataFolderPath}`);
}

const client = new SapphireClient({
  intents: [
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
  ],
  loadMessageCommandListeners: true,
  loadDefaultErrorListeners: true,
});

client
  .login(process.env.DISCORD_BOT_TOKEN)
  .then(() => {
    Logger.info("DeployNow bot successfully logged in.");
    setDynamicActivity();
  })
  .catch((error) => {
    Logger.error("Failed to log in to DeployNow bot.", {
      error: error.message,
      stack: error.stack,
    });
  });

function setDynamicActivity() {
  const activities = [
    { type: ActivityType.Playing, name: "🎰 Slots for big rewards!" },
    { type: ActivityType.Competing, name: "🃏 Blackjack with high stakes!" },
    { type: ActivityType.Playing, name: "✂️ Rock-paper-scissors for coins!" },
    { type: ActivityType.Playing, name: `🪙 Flipping coins for luck.` },
    { type: ActivityType.Competing, name: `💼 Working to earn coins!` },
    {
      type: ActivityType.Watching,
      name: `🛠️ Managing ${client.guilds.cache.size} servers`,
    },
  ];

  setInterval(() => {
    const randomActivity =
      activities[Math.floor(Math.random() * activities.length)];
    client.user?.setActivity(randomActivity.name, {
      type: randomActivity.type,
    });
  }, 60000);
}

export default client;
