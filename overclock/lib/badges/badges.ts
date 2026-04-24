import { createClient } from "@/lib/supabase/server";

import type { BadgeDefinition, ProfileBadge } from "./badge-types";

function normalizeBadgeDefinition(value: unknown): BadgeDefinition | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const candidate = value as Record<string, unknown>;

  if (
    typeof candidate.id !== "string" ||
    typeof candidate.slug !== "string" ||
    typeof candidate.label !== "string"
  ) {
    return null;
  }

  return {
    color: typeof candidate.color === "string" ? candidate.color : null,
    description:
      typeof candidate.description === "string" ? candidate.description : null,
    icon: typeof candidate.icon === "string" ? candidate.icon : null,
    id: candidate.id,
    label: candidate.label,
    slug: candidate.slug,
  };
}

export async function getBadgeDefinitions(): Promise<BadgeDefinition[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("badges")
    .select("id,slug,label,description,icon,color")
    .order("label", { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? [])
    .map((row) => normalizeBadgeDefinition(row))
    .filter((badge): badge is BadgeDefinition => Boolean(badge));
}

export async function getProfileBadges(profileId: string): Promise<ProfileBadge[]> {
  const supabase = await createClient();
  const { data: assignments, error: assignmentsError } = await supabase
    .from("profile_badges")
    .select("badge_id,granted_at")
    .eq("profile_id", profileId)
    .order("granted_at", { ascending: true });

  if (assignmentsError) {
    throw assignmentsError;
  }

  const rows = assignments ?? [];
  const badgeIds = rows
    .map((row) => (typeof row.badge_id === "string" ? row.badge_id : null))
    .filter((badgeId): badgeId is string => Boolean(badgeId));

  if (badgeIds.length === 0) {
    return [];
  }

  const { data: badges, error: badgesError } = await supabase
    .from("badges")
    .select("id,slug,label,description,icon,color")
    .in("id", badgeIds);

  if (badgesError) {
    throw badgesError;
  }

  const badgeById = new Map(
    (badges ?? [])
      .map((row) => normalizeBadgeDefinition(row))
      .filter((badge): badge is BadgeDefinition => Boolean(badge))
      .map((badge) => [badge.id, badge] as const)
  );

  return rows
    .map((row) => {
      if (typeof row.badge_id !== "string") {
        return null;
      }

      const badge = badgeById.get(row.badge_id);

      if (!badge) {
        return null;
      }

      return {
        ...badge,
        grantedAt: typeof row.granted_at === "string" ? row.granted_at : null,
      } satisfies ProfileBadge;
    })
    .filter((badge): badge is ProfileBadge => Boolean(badge));
}
