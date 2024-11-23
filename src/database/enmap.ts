import Enmap from "enmap";

/**
 * @typedef {Object} UserDataSchema
 * @property {number} balance - The user's current balance.
 * @property {number} bank - The user's bank balance (if applicable).
 * @property {Array<{ item: string, quantity: number }>} inventory - The items owned by the user.
 * @property {Object<string, string>} cooldowns - A record of cooldowns for specific actions (e.g., daily reward).
 */

/**
 * UserData Enmap
 * Stores user-specific economy data, including balance, bank, inventory, and cooldowns.
 *
 * **Key**: User ID (string)
 * **Value**: {@link UserDataSchema}
 *
 * Example:
 * ```json
 * {
 *   "balance": 1000,
 *   "bank": 500,
 *   "inventory": [
 *     { "item": "Golden Sword", "quantity": 1 },
 *     { "item": "Shield", "quantity": 2 }
 *   ],
 *   "cooldowns": {
 *     "daily": "2024-11-19T12:00:00Z",
 *     "work": "2024-11-19T13:00:00Z"
 *   }
 * }
 * ```
 */
export const UserData = new Enmap({
  name: "userData",
  ensureProps: true,
  fetchAll: true,
  dataDir: "./data",
  autoEnsure: { balance: 0, bank: 0, inventory: [], cooldowns: {} },
});

/**
 * @typedef {Object} ShopItemSchema
 * @property {number} price - The cost of the item in the economy.
 * @property {string} description - A brief description of the item.
 */

/**
 * ShopData Enmap
 * Stores items available for purchase in the shop.
 *
 * **Key**: Item Name (string)
 * **Value**: {@link ShopItemSchema}
 *
 * Example:
 * ```json
 * {
 *   "price": 500,
 *   "description": "A mighty sword for battles."
 * }
 * ```
 */
export const ShopData = new Enmap({
  name: "shopData",
  ensureProps: true,
  fetchAll: true,
  dataDir: "./data",
});

/**
 * @typedef {Object} ServerSettingsSchema
 * @property {number} dailyReward - The default amount of daily reward coins.
 * @property {number} weeklyReward - The default amount of weekly reward coins.
 * @property {string|null} adminRole - The name of the custom admin role for economy management (fallback: "Administrator").
 * @property {string|null} logChannel - The ID of the channel to log actions to (fallback: null).
 */

/**
 * ServerSettings Enmap
 * Stores per-server settings, including economy configurations and admin roles.
 *
 * **Key**: Server ID (string)
 * **Value**: {@link ServerSettingsSchema}
 *
 * Example:
 * ```json
 * {
 *   "dailyReward": 100,
 *   "weeklyReward": 500,
 *   "adminRole": "EconomyManager",
 *   "modlogChannel": "123456789012345678",
 * }
 * ```
 */
export const ServerSettings = new Enmap({
  name: "serverSettings",
  ensureProps: true,
  fetchAll: true,
  dataDir: "./data",
  autoEnsure: {
    dailyReward: 100,
    weeklyReward: 500,
    adminRole: null,
    modlogChannel: null,
  },
});

/**
 * @typedef {Object} LogEntrySchema
 * @property {string} user - The ID of the user performing the action.
 * @property {string} action - The type of action (e.g., "addcoins").
 * @property {number} amount - The amount associated with the action.
 * @property {string} timestamp - The ISO timestamp of when the action occurred.
 * @property {string} admin - The ID of the admin who performed the action.
 */

/**
 * LogsData Enmap
 * Tracks admin actions for auditing and transparency purposes.
 *
 * **Key**: Action ID (string)
 * **Value**: {@link LogEntrySchema}
 *
 * Example:
 * ```json
 * {
 *   "user": "123456789012345678",
 *   "action": "addcoins",
 *   "amount": 500,
 *   "timestamp": "2024-11-19T12:00:00Z",
 *   "admin": "987654321098765432"
 * }
 * ```
 */
export const LogsData = new Enmap({
  name: "logsData",
  ensureProps: true,
  fetchAll: true,
  dataDir: "./data",
});

/**
 * @typedef {Array<{ user: string, balance: number }>} LeaderboardSchema
 */

/**
 * LeaderboardData Enmap
 * Stores derived leaderboard data based on user balances.
 *
 * **Key**: Leaderboard ID (string)
 * **Value**: {@link LeaderboardSchema}
 *
 * Example:
 * ```json
 * [
 *   { "user": "123456789012345678", "balance": 1000 },
 *   { "user": "987654321098765432", "balance": 800 }
 * ]
 * ```
 */
export const LeaderboardData = new Enmap({
  name: "leaderboardData",
  ensureProps: true,
  fetchAll: true,
  dataDir: "./data",
});
