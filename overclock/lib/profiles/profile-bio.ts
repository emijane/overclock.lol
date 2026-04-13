export const PROFILE_BIO_MAX_CHARACTERS = 160;

export function sanitizeProfileBio(value: FormDataEntryValue | null) {
  const parsed = value?.toString() ?? "";
  const normalized = parsed
    .replace(/[\u0000-\u0008\u000B-\u001F\u007F]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  if (normalized.length === 0) {
    return null;
  }

  return normalized;
}

export function validateProfileBio(bio: string | null) {
  if (!bio) {
    return null;
  }

  if (bio.length > PROFILE_BIO_MAX_CHARACTERS) {
    return `Bio must be ${PROFILE_BIO_MAX_CHARACTERS} characters or less.`;
  }

  return null;
}
