# 🚀 Bloom: Economy Discord Bot Starter

Build smarter, faster, and better with Bloom – the ultimate Discord bot starter kit for creating feature-rich server bots. Whether you're building moderation tools or an engaging economy system, Bloom is designed to handle it all.

---

## ✨ Features

- **Advanced Command Framework**: Built with Sapphire.js for handling slash commands and context menus.
- **Interactive Economy System**: Engage your server community with coins, shops, leaderboards, and more.
- **Comprehensive Moderation Tools**: Pre-built moderation commands for efficient server management.
- **Modular Event Handlers**: Scalable architecture to handle Discord gateway events.
- **Persistent Database**: Enmap-backed fast and reliable storage for economy data, user balances, and server settings.

---

## 🌟 Why Choose Bloom?

- **Performance Optimized**: Scalable for large servers with thousands of users.
- **Developer Friendly**: Clean, pre-configured code saves you time.
- **Customizable Features**: Extend and modify the bot to suit your server's unique needs.
- **Community Focused**: Features designed to enhance engagement and foster active communities.

---

## ⚙️ Core Features

### 💰 Economy User Commands

- `/balance [user]`: Check your or another user's balance.
- `/daily`: Claim daily coins.
- `/weekly`: Claim weekly coins.
- `/work`: Earn coins through a task.
- `/shop`: View & Buy available items in the shop.
- `/inventory [user]`: View your or another user's inventory.
- `/leaderboard`: See the top users by balance.
- `/flipcoin [amount]`: Bet on a coin flip game.
- `/slots [amount]`: Play the slot machine.
- `/blackjack [amount]`: Play a game of blackjack.
- `/rps [choice] [amount]`: Play rock-paper-scissors for coins.

### ⚙️ Admin Economy Commands

- `/addcoins [user] [amount]`: Add coins to a user's account.
- `/removecoins [user] [amount]`: Remove coins from a user's account.
- `/setcoins [user] [amount]`: Set a user's balance.
- `/additem [item] [price]`: Add a new item to the shop.
- `/removeitem [item]`: Remove an item from the shop.
- `/edititem [item] [new_price]`: Edit an existing item's price.
- `/clearshop`: Clear all items in the shop.
- `/resetinventory [user]`: Reset a user's inventory.
- `/setup`: Configure server settings, including:
  - Admin roles
  - Daily and weekly rewards
  - Modlog and Action log channel

### 🛠️ Additional Commands

- `/ping`: Check bot's connectivity and response time.
- `/help`: Display all available commands and bot information.

---

## 🌟 Why Bloom Stands Out

- **Time-Saving**: Pre-built features let you get started immediately, reducing development time.
- **Scalable Architecture**: Designed to grow with your community.
- **Powerful Framework**: Sapphire.js ensures maintainability and robustness.
- **Customizable User Experience**: Enhance and tailor bot interactions to your server's needs.

---

## 🚀 Getting Started

### 1. **Download or Fork the Repository**

#### **Option 1: Download as a ZIP**
```
1. Click the **Code** button on the repository page.
2. Select **Download ZIP**.
3. Extract the ZIP file to your desired location.
```

#### **Option 2: Clone the Repository (Recommended)**
```sh
git clone https://github.com/BankkRoll/Discord-Economy-Bloom.git
```

#### **Option 3: Fork the Repository**
```
1. Click the **Fork** button on the repository page.
2. Navigate to your forked repository.
3. Clone your fork using:
```

```sh
git clone https://github.com/BankkRoll/Discord-Economy-Bloom.git
```

---

### 2. **Install Dependencies**

Run the following command to install required packages:

```
npm install
```

---

### 3. **Set Up Environment Variables**

Create a `.env` file in the root directory and add the following:

```
# Discord Bot Configuration
DISCORD_BOT_TOKEN="<your-bot-token>"
DISCORD_CLIENT_ID="<your-client-id>"
DISCORD_CLIENT_SECRET="<your-client-secret>"
```

---

### 4. **Build the Bot**

Run the following command to build the bot:

```
npm run build
```

### 5. **Run the Bot**

Run the following command to start the bot:

```
npm run start
```

---

## 📦 Deployment

Bloom is pre-configured for deployment on hosting platforms like SparkedHost, Railway, Heroku, or VPS servers.

1. Push your project to a GitHub repository.
2. Deploy using your preferred platform.
3. Configure environment variables in the hosting environment.
4. Launch your bot.
