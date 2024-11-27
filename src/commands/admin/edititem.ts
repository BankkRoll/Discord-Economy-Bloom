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

export default class EditItemCommand extends Command {
  constructor(context: Command.Context, options: Command.Options) {
    super(context, {
      ...options,
      name: "edititem",
      description: "Edit the attributes of an existing item in the shop.",
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
            .setDescription("The name of the item to edit.")
            .setRequired(true),
        )
        .addIntegerOption((option) =>
          option
            .setName("new_price")
            .setDescription("The new price of the item."),
        )
        .addStringOption((option) =>
          option
            .setName("new_description")
            .setDescription("The new description of the item."),
        )
        .addRoleOption((option) =>
          option
            .setName("new_role")
            .setDescription("The new role to be granted with the item."),
        )
        .addStringOption((option) =>
          option
            .setName("new_image_url")
            .setDescription("The new image URL for the item."),
        )
        .addIntegerOption((option) =>
          option
            .setName("new_inventory")
            .setDescription(
              "The new inventory limit (total items available). Use 0 for unlimited.",
            ),
        )
        .addIntegerOption((option) =>
          option
            .setName("new_user_limit")
            .setDescription(
              "The new purchase limit per user. Use 0 for unlimited.",
            ),
        ),
    );
  }

  async chatInputRun(interaction: ChatInputCommandInteraction) {
    const item = interaction.options.getString("item", true);
    const newPrice = interaction.options.getInteger("new_price");
    const newDescription = interaction.options.getString("new_description");
    const newRole = interaction.options.getRole("new_role") as Role | null;
    const newImageUrl = interaction.options.getString("new_image_url");
    const newInventory = interaction.options.getInteger("new_inventory");
    const newUserLimit = interaction.options.getInteger("new_user_limit");

    const member = interaction.guild?.members.cache.get(
      interaction.user.id,
    ) as GuildMember;
    if (!hasAdminOrRolePermission(member, interaction.guildId)) {
      await interaction.reply({
        content: `❌ You do not have permission to use this command.`,
        ephemeral: true,
      });
      return;
    }

    if (!ShopData.has(item)) {
      await interaction.reply({
        content: `❌ An item with the name "${item}" does not exist in the shop.`,
        ephemeral: true,
      });
      return;
    }

    const itemData = ShopData.get(item);

    // Validate and update price
    if (newPrice !== null) {
      if (newPrice <= 0) {
        await interaction.reply({
          content: `❌ The price must be a positive integer.`,
          ephemeral: true,
        });
        return;
      }
      itemData.price = newPrice;
    }

    // Update description if provided
    if (newDescription) {
      itemData.description = newDescription;
    }

    // Update role if provided
    if (newRole) {
      itemData.role = newRole.id;
    }

    // Validate and update image URL
    if (newImageUrl) {
      const urlPattern = /^(https?:\/\/[^\s]+)$/;
      if (!urlPattern.test(newImageUrl)) {
        await interaction.reply({
          content: `❌ The image URL must be a valid URL.`,
          ephemeral: true,
        });
        return;
      }
      itemData.imageUrl = newImageUrl;
    }

    // Validate and update inventory
    if (newInventory !== null) {
      if (newInventory < 0) {
        await interaction.reply({
          content: `❌ The inventory limit must be a positive integer or unlimited (0).`,
          ephemeral: true,
        });
        return;
      }
      itemData.inventory = newInventory === 0 ? null : newInventory; // Null for unlimited
    }

    // Validate and update user purchase limit
    if (newUserLimit !== null) {
      if (newUserLimit < 0) {
        await interaction.reply({
          content: `❌ The user limit must be a positive integer or unlimited (0).`,
          ephemeral: true,
        });
        return;
      }
      itemData.userLimit = newUserLimit === 0 ? null : newUserLimit; // Null for unlimited
    }

    // Save updated item data
    ShopData.set(item, itemData);

    // Create Embed for Interaction Reply
    const embed = new EmbedBuilder()
      .setTitle("Item Updated")
      .addFields(
        { name: "Item Name", value: item, inline: true },
        { name: "Price", value: `${itemData.price}`, inline: true },
        { name: "Description", value: itemData.description, inline: false },
        {
          name: "Role",
          value: itemData.role ? `<@&${itemData.role}>` : "None",
          inline: true,
        },
        {
          name: "Inventory",
          value: itemData.inventory
            ? `${itemData.inventory} available`
            : "Unlimited",
          inline: true,
        },
        {
          name: "User Limit",
          value: itemData.userLimit
            ? `${itemData.userLimit} per user`
            : "Unlimited",
          inline: true,
        },
      )
      .setColor(0xf1c40f)
      .setTimestamp();

    if (itemData.imageUrl) embed.setImage(itemData.imageUrl);

    await interaction.reply({ embeds: [embed] });

    // Log the Action
    await logAction(
      interaction.guildId || "",
      {
        action: "edititem",
        admin: interaction.user.id,
        description: `Admin updated the item "${item}" with new attributes.`,
        item,
        amount: itemData.price,
        role: newRole?.id || null,
        imageUrl: newImageUrl || null,
        inventory: newInventory || null,
        userLimit: newUserLimit || null,
      },
      interaction.client,
    );

    return;
  }
}
