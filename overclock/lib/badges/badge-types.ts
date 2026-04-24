export type BadgeDefinition = {
  color: string | null;
  description: string | null;
  icon: string | null;
  id: string;
  label: string;
  slug: string;
};

export type ProfileBadge = BadgeDefinition & {
  grantedAt: string | null;
};

