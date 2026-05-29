import test from "node:test";
import assert from "node:assert/strict";

import { resolveProfileMediaUrl, PROFILE_AVATAR_DEFAULT_PATH } from "@/lib/profiles/profile-media";

function withSupabaseUrl(value: string, assertion: () => void) {
  const previousValue = process.env.NEXT_PUBLIC_SUPABASE_URL;

  process.env.NEXT_PUBLIC_SUPABASE_URL = value;

  try {
    assertion();
  } finally {
    if (previousValue === undefined) {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
      return;
    }

    process.env.NEXT_PUBLIC_SUPABASE_URL = previousValue;
  }
}

test("resolves profile-media storage paths into public URLs", () => {
  withSupabaseUrl("https://example.supabase.co", () => {
    assert.equal(
      resolveProfileMediaUrl("profile-pictures/user-1/avatar"),
      "https://example.supabase.co/storage/v1/object/public/profile-media/profile-pictures/user-1/avatar"
    );
  });
});

test("preserves absolute remote avatar URLs", () => {
  withSupabaseUrl("https://example.supabase.co", () => {
    assert.equal(
      resolveProfileMediaUrl("https://cdn.discordapp.com/avatars/user/avatar.png"),
      "https://cdn.discordapp.com/avatars/user/avatar.png"
    );
  });
});

test("returns null for missing avatar inputs", () => {
  withSupabaseUrl("https://example.supabase.co", () => {
    assert.equal(resolveProfileMediaUrl(null), null);
  });
});

test("profile avatar URLs still resolve the default avatar path", () => {
  withSupabaseUrl("https://example.supabase.co", () => {
    assert.equal(
      resolveProfileMediaUrl(PROFILE_AVATAR_DEFAULT_PATH),
      "https://example.supabase.co/storage/v1/object/public/profile-media/profile-pictures/default_icon.png"
    );
  });
});
