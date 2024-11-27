import { ApplicationCommandRegistry, Command } from "@sapphire/framework";

import { ChatInputCommandInteraction } from "discord.js";
import { UserData } from "../../database/enmap.js";
import axios from "axios";
import { createEmbed } from "../../utils/embed.js";

const COINGECKO_API = "https://api.coingecko.com/api/v3/simple/price";
const SUPPORTED_COINS = ["bitcoin", "ethereum", "solana"]; // Supported coins

export default class BalanceCommand extends Command {
  constructor(context: Command.Context, options: Command.Options) {
    super(context, {
      ...options,
      name: "balance",
      description:
        "Check your balance or another user's balance and portfolio.",
    });
  }

  registerApplicationCommands(registry: ApplicationCommandRegistry) {
    registry.registerChatInputCommand((builder) =>
      builder
        .setName(this.name)
        .setDescription(this.description)
        .addUserOption((option) =>
          option
            .setName("user")
            .setDescription("The user to check balance for."),
        ),
    );
  }

  async chatInputRun(interaction: ChatInputCommandInteraction) {
    try {
      const user = interaction.options.getUser("user") || interaction.user;

      // Retrieve or ensure user data with proper typing
      const userData = UserData.ensure(user.id, {
        balance: 1000, // Default balance
        portfolio: { bitcoin: 0, ethereum: 0, solana: 0 } as Record<
          string,
          number
        >,
      });

      // Fetch live cryptocurrency prices
      const prices = await this.fetchCryptoPrices(SUPPORTED_COINS);

      // Calculate portfolio values with proper typing
      const portfolioValues = Object.entries(userData.portfolio).map(
        ([coin, amount]) => {
          if (typeof amount !== "number") {
            throw new Error(`Invalid amount for ${coin}: ${amount}`);
          }
          const price = prices[coin]?.usd || 0; // Handle missing price data
          const value = price * amount;
          return { coin, amount, price, value };
        },
      );

      // Calculate total portfolio value in USD
      const totalPortfolioValue = portfolioValues.reduce(
        (sum, entry) => sum + entry.value,
        0,
      );

      // Create fields for the portfolio to display in the embed
      const portfolioFields = portfolioValues.map((entry) => ({
        name: `💎 ${entry.coin.toUpperCase()}`,
        value: `Amount: **${entry.amount.toFixed(4)}**\nValue: \`$${entry.value.toFixed(
          2,
        )}\` (Price: \`$${entry.price.toFixed(2)}\`)`,
        inline: true,
      }));

      // Create the embed
      const embed = createEmbed({
        title: `${user.username}'s Balance & Portfolio`,
        fields: [
          {
            name: "💰 Balance",
            value: `\`$${userData.balance.toFixed(2)}\``,
            inline: false,
          },
          ...portfolioFields,
          {
            name: "📊 Total Portfolio Value",
            value: `\`$${totalPortfolioValue.toFixed(2)}\``,
            inline: false,
          },
        ],
        color: 0x22c55e, // Success color
        timestamp: new Date(),
      });

      // Send the reply with the embed
      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error("Error in BalanceCommand:", error);

      await interaction.reply({
        content: "❌ An error occurred while retrieving the portfolio.",
        ephemeral: true,
      });
    }
  }

  /**
   * Fetches live cryptocurrency prices from the CoinGecko API.
   * @param coins Array of supported coin IDs
   * @returns A record of coin prices in USD
   */
  async fetchCryptoPrices(coins: string[]): Promise<Record<string, any>> {
    try {
      const response = await axios.get(COINGECKO_API, {
        params: {
          ids: coins.join(","),
          vs_currencies: "usd",
        },
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching cryptocurrency prices:", error);
      throw new Error("Unable to fetch cryptocurrency prices at the moment.");
    }
  }
}
