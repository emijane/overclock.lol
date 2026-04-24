const ADMIN_USERNAMES = (process.env.ADMIN_USERNAMES ?? "")
  .split(",")
  .map((value) => value.trim().toLowerCase())
  .filter(Boolean);

export function canAccessAdmin(profileUsername: string | null | undefined) {
  if (!profileUsername) {
    return false;
  }

  if (ADMIN_USERNAMES.length === 0) {
    return process.env.NODE_ENV !== "production";
  }

  return ADMIN_USERNAMES.includes(profileUsername.toLowerCase());
}

