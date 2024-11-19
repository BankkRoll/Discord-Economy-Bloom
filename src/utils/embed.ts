// src/utils/embed.ts
import {
  APIEmbedField,
  ColorResolvable,
  EmbedBuilder,
  EmbedData,
} from "discord.js";

export const DEFAULT_FOOTER = {
  text: "Powered by: DeployNow",
  iconURL: "https://deploynow.site/icon.png",
};

export const DEFAULT_COLOR: ColorResolvable = "#2ECC71";

export function createEmbed(data: EmbedData): EmbedBuilder {
  const embed = new EmbedBuilder();

  // Set title
  if (data.title) embed.setTitle(data.title);

  // Set description
  if (data.description) embed.setDescription(data.description);

  // Set URL
  if (data.url) embed.setURL(data.url);

  // Handle timestamp
  if (data.timestamp instanceof Date || typeof data.timestamp === "number") {
    embed.setTimestamp(data.timestamp);
  } else if (typeof data.timestamp === "string") {
    const date = new Date(data.timestamp);
    if (!isNaN(date.getTime())) {
      embed.setTimestamp(date);
    }
  }

  // Set color with fallback
  embed.setColor((data.color as ColorResolvable) || DEFAULT_COLOR);

  // Handle footer
  if (data.footer) {
    embed.setFooter({
      text: data.footer.text,
      iconURL: data.footer.iconURL,
    });
  } else {
    embed.setFooter(DEFAULT_FOOTER);
  }

  // Handle image
  if (data.image) embed.setImage(data.image.url);

  // Handle thumbnail
  if (data.thumbnail) embed.setThumbnail(data.thumbnail.url);

  // Handle author
  if (data.author) {
    embed.setAuthor({
      name: data.author.name,
      url: data.author.url,
      iconURL: data.author.iconURL,
    });
  }

  // Handle fields with advanced validation
  if (data.fields) {
    const validFields = data.fields.filter(
      (field) => field.name && field.value && field.value.length <= 1024
    ) as APIEmbedField[];
    if (validFields.length > 0) embed.addFields(...validFields);
  }

  return embed;
}
