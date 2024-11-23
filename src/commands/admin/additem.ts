import { ApplicationCommandRegistry, Command } from "@sapphire/framework";
import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  GuildMember,
  Role,
} from "discord.js";

import { ShopData } from "../../database/enmap.js";
import { logAction } from "../../utils/events.js";
import { hasAdminOrRolePermission } from "../../utils/permissions.js";

export default class AddItemCommand extends Command {
  constructor(context: Command.Context, options: Command.Options) {
    super(context, {
      ...options,
      name: "additem",
      description: "Add a new item to the shop.",
    });
  }

  registerApplicationCommands(registry: ApplicationCommandRegistry) {
    registry.registerChatInputCommand((builder) =>
      builder
        .setName(this.name)
        .setDescription(this.description)
        .addStringOption((option) =>
          option
            .setName("item")
            .setDescription("The name of the item to add.")
            .setRequired(true)
        )
        .addIntegerOption((option) =>
          option
            .setName("price")
            .setDescription("The price of the item.")
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName("description")
            .setDescription("A description of the item.")
        )
        .addRoleOption((option) =>
          option
            .setName("role")
            .setDescription("Role to be granted when this item is purchased.")
        )
        .addStringOption((option) =>
          option
            .setName("image_url")
            .setDescription("An image URL for the item.")
        )
        .addIntegerOption((option) =>
          option
            .setName("inventory")
            .setDescription(
              "The maximum number of items that can be sold (default: unlimited)."
            )
        )
        .addIntegerOption((option) =>
          option
            .setName("user_limit")
            .setDescription(
              "The maximum number of items a single user can purchase (default: unlimited)."
            )
        )
    );
  }

  async chatInputRun(interaction: ChatInputCommandInteraction) {
    const item = interaction.options.getString("item", true);
    const price = interaction.options.getInteger("price", true);
    const description =
      interaction.options.getString("description") ||
      "No description provided.";
    const role = interaction.options.getRole("role") as Role | null;
    const imageUrl = interaction.options.getString("image_url") || null;
    const inventory = interaction.options.getInteger("inventory") || null;
    const userLimit = interaction.options.getInteger("user_limit") || null;

    const member = interaction.guild?.members.cache.get(
      interaction.user.id
    ) as GuildMember;
    if (!hasAdminOrRolePermission(member, interaction.guildId)) {
      await interaction.reply({
        content: `❌ You do not have permission to use this command.`,
        ephemeral: true,
      });
      return;
    }

    if (price <= 0) {
      await interaction.reply({
        content: `❌ The price must be a positive integer.`,
        ephemeral: true,
      });
      return;
    }

    if (inventory !== null && inventory <= 0) {
      await interaction.reply({
        content: `❌ The inventory must be a positive integer or unlimited.`,
        ephemeral: true,
      });
      return;
    }

    if (userLimit !== null && userLimit <= 0) {
      await interaction.reply({
        content: `❌ The user limit must be a positive integer or unlimited.`,
        ephemeral: true,
      });
      return;
    }

    if (ShopData.has(item)) {
      await interaction.reply({
        content: `❌ An item with the name "${item}" already exists in the shop.`,
        ephemeral: true,
      });
      return;
    }

    // Add Item to Shop with Extended Attributes
    ShopData.set(item, {
      price,
      description,
      role: role?.id || null,
      imageUrl,
      inventory,
      userLimit,
      sold: 0, // Initialize sold count
    });

    // Create Embed for Interaction Reply
    const embed = new EmbedBuilder()
      .setTitle("Item Added")
      .addFields(
        { name: "Item Name", value: item, inline: true },
        { name: "Price", value: `${price}`, inline: true },
        { name: "Description", value: description, inline: false },
        {
          name: "Role Granted",
          value: role ? `<@&${role.id}>` : "None",
          inline: true,
        },
        {
          name: "Inventory",
          value: inventory ? `${inventory} available` : "Unlimited",
          inline: true,
        },
        {
          name: "User Limit",
          value: userLimit ? `${userLimit} per user` : "Unlimited",
          inline: true,
        }
      )
      .setColor(0x3498db)
      .setTimestamp();

    if (imageUrl) embed.setImage(imageUrl);

    await interaction.reply({ embeds: [embed] });

    // Log the Action
    await logAction(
      interaction.guildId || "",
      {
        action: "additem",
        admin: interaction.user.id,
        description: `Admin added the item "${item}" with price: ${price}, role: ${role?.id || "None"}, description: ${description}, inventory: ${inventory || "Unlimited"}, user limit: ${userLimit || "Unlimited"}, image: ${imageUrl || "None"}.`,
        item,
        amount: price,
      },
      interaction.client
    );

    return; // Ensure function resolves
  }
}
