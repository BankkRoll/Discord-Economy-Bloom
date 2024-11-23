import { Events, Listener, SapphireClient } from "@sapphire/framework";

import { Logger } from "../utils/logger.js";

export class ReadyListener extends Listener {
  constructor(context: Listener.Context) {
    super(context, {
      once: true,
      event: Events.ClientReady,
    });
  }

  run(client: SapphireClient) {
    const { username, id } = client.user!;

    Logger.info(`🚀 DeployNow Bot is now ready!`, {
      botName: username,
      botId: id,
      guildCount: client.guilds.cache.size,
      userCount: client.users.cache.size,
      uptime: `${Math.floor(process.uptime() / 60)} minutes`,
    });

    Logger.info(
      `Monitoring ${client.guilds.cache.size} guilds and ${client.users.cache.size} users.`
    );

    Logger.info(
      `Invite your bot to servers using this link: https://discord.com/oauth2/authorize?client_id=${id}&permissions=8&scope=bot%20applications.commands`
    );
  }
}
