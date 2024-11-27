import { Events, Listener } from "@sapphire/framework";

import { Logger } from "../utils/logger.js";

export class ErrorListener extends Listener {
  constructor(context: Listener.Context) {
    super(context, {
      event: Events.MessageCommandError,
    });
  }

  run(error: Error, { command, message }: { command: any; message: any }) {
    Logger.error(
      `⚠️ An error occurred while executing a command in DeployNow Bot.`,
      {
        errorMessage: error.message,
        errorStack: error.stack,
        user: message.author.tag,
        userId: message.author.id,
        commandName: command.name,
        commandContent: message.content,
        guildName: message.guild?.name || "DM",
        guildId: message.guild?.id || "N/A",
        channelName: message.channel.name,
        channelId: message.channel.id,
      },
    );

    // Optional: Notify the user that an error occurred
    message.reply({
      content:
        "An unexpected error occurred while processing your command. Please try again later or contact the support team.",
    });
  }
}
