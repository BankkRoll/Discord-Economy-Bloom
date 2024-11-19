# 🤖 DeployNow: Discord Bot

A powerful Discord bot template built with **Discord.js** and **Sapphire.js**, focused on creating moderation and economy bots with ease. Designed for scalability, this template provides a pre-built framework for building professional-grade bots.

---

## 🚀 Features

- **Advanced Command Framework**: Built on Sapphire.js for effortless command handling, including slash commands and context menus.
- **Event Handlers**: Modular event architecture for precise handling of Discord gateway events.
- **Dynamic Error Handling**: Comprehensive error messages for invalid input, missing permissions, and more.
- **Edge Case Management**: Prevents race conditions, duplicate commands, and invalid data states.
- **Role and Permission Checks**: Ensures only authorized users can access admin or high-risk commands.
- **Per-Guild Settings**: Fully configured per-guild data to customize moderation, economy, and more for each server.
- **Logging System**: Tracks all major actions (economy, moderation) for transparency and auditing.
- **Database Integration**: Pre-configured with **Enmap** for managing all economy and bot-related data with persistence.

---

## 📦 Command Overview

### **Economy Commands**

#### **Economy Role Admin Commands**
1. `/addcoins`  
   **Description**: Adds a specified amount of coins to a user's account.  
   **Props**:  
   - `user` (required): The user to add coins to.  
   - `amount` (required): The amount of coins to add.  
   **Validations**: Ensures `amount` is a positive integer.  
   **Example**: `/addcoins @user 1000`

2. `/removecoins`  
   **Description**: Removes a specified amount of coins from a user's account.  
   **Props**:  
   - `user` (required): The user to remove coins from.  
   - `amount` (required): The amount of coins to remove.  
   **Validations**: Ensures balance doesn’t go below zero.  
   **Example**: `/removecoins @user 500`

3. `/setcoins`  
   **Description**: Sets a user's balance to a specific amount.  
   **Props**:  
   - `user` (required): The user to set the balance for.  
   - `amount` (required): The balance amount.  
   **Validations**: Ensures `amount` is a valid positive integer.  
   **Example**: `/setcoins @user 2000`

4. `/additem`  
   **Description**: Adds a new item to the server's shop with a specified price.  
   **Props**:  
   - `item` (required): The name of the item.  
   - `price` (required): The item's price.  
   **Validations**: Prevents duplicate items and ensures valid pricing.  
   **Example**: `/additem "Golden Sword" 500`

5. `/removeitem`  
   **Description**: Removes an item from the shop.  
   **Props**:  
   - `item` (required): The name of the item to remove.  
   **Validations**: Ensures the item exists in the shop.  
   **Example**: `/removeitem "Golden Sword"`

6. `/edititem`  
   **Description**: Edits an existing item's price in the shop.  
   **Props**:  
   - `item` (required): The name of the item.  
   - `new_price` (required): The new price of the item.  
   **Validations**: Ensures the item exists and `new_price` is valid.  
   **Example**: `/edititem "Golden Sword" 700`

7. `/clearshop`  
   **Description**: Clears all items in the shop.  
   **Props**: None.  
   **Example**: `/clearshop`

8. `/resetinventory`  
   **Description**: Clears a user's inventory.  
   **Props**:  
   - `user` (required): The user whose inventory to reset.  
   **Example**: `/resetinventory @user`

9. `/resetleaderboard`  
   **Description**: Resets the leaderboard data.  
   **Props**: None.  
   **Example**: `/resetleaderboard`

10. `/disableeconomy`  
    **Description**: Disables the economy system for the server.  
    **Props**: None.  
    **Example**: `/disableeconomy`

11. `/enableeconomy`  
    **Description**: Re-enables the economy system for the server.  
    **Props**: None.  
    **Example**: `/enableeconomy`

---

#### **User Commands**
1. `/balance`  
   **Description**: Displays the current balance of a user.  
   **Props**:  
   - `user` (optional): The user to check the balance for. Defaults to the command issuer.  
   **Example**: `/balance`

2. `/daily`  
   **Description**: Claims a daily reward of coins.  
   **Props**: None.  
   **Validations**: Ensures cooldowns are respected.  
   **Example**: `/daily`

3. `/weekly`  
   **Description**: Claims a weekly reward of coins.  
   **Props**: None.  
   **Validations**: Ensures cooldowns are respected.  
   **Example**: `/weekly`

4. `/work`  
   **Description**: Earns coins by completing a random work task.  
   **Props**: None.  
   **Example**: `/work`

5. `/buy`  
   **Description**: Purchases an item from the shop.  
   **Props**:  
   - `item` (required): The name of the item to purchase.  
   **Validations**: Ensures the user has enough balance and the item exists.  
   **Example**: `/buy "Golden Sword"`

6. `/shop`  
   **Description**: Displays all available items in the shop.  
   **Props**: None.  
   **Example**: `/shop`

7. `/inventory`  
   **Description**: Displays the inventory of a user.  
   **Props**:  
   - `user` (optional): The user whose inventory to display. Defaults to the command issuer.  
   **Example**: `/inventory`

8. `/leaderboard`  
   **Description**: Displays the top users with the highest balances.  
   **Props**: None.  
   **Example**: `/leaderboard`

9. `/flipcoin`
   **Description**: Bets coins on a coin flip (heads or tails).
   **Props**:
   - `amount` (required): The amount of coins to bet.
   **Validations**:
   - Ensures the user has enough coins.
   - Limits the bet amount to prevent abuse.
   **Example**: `/flipcoin 100`

10. `/slots`
   **Description**: Plays a slot machine game to win coins.
   **Props**:
   - `amount` (required): The amount of coins to bet.
   **Validations**:
   - Ensures the user has enough coins.
   - Limits the bet amount and includes cooldowns.
   **Example**: `/slots 50`

11. `/blackjack`
   **Description**: Plays a game of blackjack for coins.
   **Props**:
   - `amount` (required): The amount of coins to bet.
   **Validations**:
   - Ensures valid bet amounts.
   - Handles automatic calculations for wins/losses.
   **Example**: `/blackjack 200`

12. `/rps`
   **Description**: Plays rock-paper-scissors against the bot for coins.
   **Props**:
   - `choice` (required): The player's choice (`rock`, `paper`, or `scissors`).
   - `amount` (required): The amount of coins to bet.
   **Validations**:
   - Ensures valid input for `choice`.
   - Verifies sufficient balance and bet amount.
   **Example**: `/rps rock 100`

13. `/spinwheel`
   **Description**: Spins a wheel for random rewards.
   **Props**:
   - `amount` (required): The amount of coins to spend on the spin.
   **Validations**:
   - Ensures sufficient balance.
   - Includes a configurable cooldown per server.
   **Example**: `/spinwheel 50`

14. `/lottery-ticket`
   **Description**: Buys and scratches a lottery ticket for a chance to win coins.
   **Props**:
   - `amount` (required): The price of the lottery ticket.
   **Validations**:
   - Verifies that the ticket price is valid.
   - Ensures sufficient balance before purchase.
   **Example**: `/lottery-ticket 50`


15. & 16.   ping & help as well

---

## 🗄 Database Setup

### Using Enmap
The bot uses **Enmap** for all data storage, providing fast, persistent, and easy-to-use key-value data handling.

### Enmap Structures

1. **User Data**
   - **Purpose**: Tracks individual user data, including balances and inventory.
   - **Key**: User ID.
   - **Value Example**:
     ```json
     {
       "balance": 1000,
       "bank": 500,
       "inventory": [
         { "item": "Golden Sword", "quantity": 1 },
         { "item": "Shield", "quantity": 2 }
       ]
     }
     ```
   - **Edge Case Handling**:
     - Prevents negative balances or deposits.
     - Validates inventory actions (e.g., removing items not owned).

2. **Shop Data**
   - **Purpose**: Stores available items in the shop.
   - **Key**: Item Name.
   - **Value Example**:
     ```json
     {
       "price": 500,
       "description": "A mighty sword for battles."
     }
     ```
   - **Edge Case Handling**:
     - Disallows duplicate item names.
     - Validates positive pricing values.

3. **Server Settings**
   - **Purpose**: Stores per-server configurations.
   - **Key**: Server ID.
   - **Value Example**:
     ```json
     {
       "modlogChannel": "123456789012345678",
       "economyEnabled": true,
       "dailyReward": 100
     }
     ```
   - **Edge Case Handling**:
     - Ensures server-specific settings are isolated.
     - Prevents invalid configuration values.

4. **Logs Data**
   - **Purpose**: Tracks all significant actions for auditing purposes.
   - **Key**: Action ID.
   - **Value Example**:
     ```json
     {
       "user": "123456789012345678",
       "action": "addcoins",
       "amount": 500,
       "timestamp": "2024-11-19T12:00:00Z"
     }
     ```

5. **Leaderboard Data**
   - **Purpose**: Automatically calculated based on user balances.
   - **Key**: Leaderboard ID.
   - **Value Example**:
     ```json
     [
       { "user": "123456789012345678", "balance": 1000 },
       { "user": "987654321098765432", "balance": 800 }
     ]
     ```

---

## Edge Cases and Validations

### Input Validation
- **Numeric Validation**: Ensures all numeric fields (e.g., balances, amounts) are valid, positive, and within reasonable limits.
- **User Validation**: Verifies user mentions exist and are valid members of the guild.

### Command Cooldowns
- Cooldowns prevent rapid execution of commands like `/rob` or `/work`.
- Configurable per server.

### Permissions
- Economy Role Admin commands enforce role or permission checks (`Economy Role`).
- User commands are restricted to valid roles for economy actions.

### Data Integrity
- Prevents data corruption by validating all Enmap writes.
- Ensures atomic operations (e.g., simultaneous updates on balances).

---

## Logging and Debugging

### Logs
- Tracks admin actions (e.g., `/addcoins`) and stores logs in a dedicated Enmap structure for auditing.

### Error Handling
- Comprehensive try-catch blocks for all command handlers.
- User-friendly error messages for invalid inputs or permissions.

## Initial Setup

1. **Default Settings**:
   - `dailyReward`: `100`
   - `weeklyReward`: `500`
   - `economyEnabled`: `true`
   - `modlogChannel`: `null` (must be set by admin).
   - `actionlogChannel`: `null` (must be set by admin).

2. **Setup Commands**:
   - `/setup`: Configure economy settings, economy role(defaults to admin), logging channels and other settings.  
