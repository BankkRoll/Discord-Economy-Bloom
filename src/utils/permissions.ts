import { GuildMember, PermissionsBitField } from "discord.js";

import { ServerSettings } from "../database/enmap.js";

/**
 * Checks if a member has admin permissions or a specified role for economy commands.
 *
 * @param member - The member to check. Can be undefined if not found.
 * @param guildId - The ID of the guild.
 * @returns `true` if the member has the required permissions or role, otherwise `false`.
 */
export function hasAdminOrRolePermission(
  member: GuildMember | undefined,
  guildId: string | null,
): boolean {
  if (!member || !guildId) return false;

  const serverSettings = ServerSettings.get(guildId);
  const adminRoleName = serverSettings?.adminRole || null;

  return (
    member.permissions.has(PermissionsBitField.Flags.Administrator) ||
    (adminRoleName && member.roles.cache.some((role) => role.name === adminRoleName))
  );
}
