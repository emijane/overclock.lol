import Link from "next/link";
import { FilterIcon } from "lucide-react";

import { PageContainer } from "@/app/components/page-container";
import { createLFGPost } from "@/app/lfg/actions";
import { AuthMessage } from "@/app/login/components";
import { getCompetitiveProfile } from "@/lib/competitive/competitive-profile";
import { COMPETITIVE_ROLE_OPTIONS } from "@/lib/competitive/competitive-profile-types";
import { getProfileHeroPools } from "@/lib/heroes/profile-hero-pools";
import { HERO_ROSTER } from "@/lib/heroes/hero-roster";
import type { LFGFeedFilters } from "@/lib/lfg/lfg-feed-filters";
import type { LFGType } from "@/lib/lfg/lfg-post-types";
import { getActiveLFGPosts } from "@/lib/lfg/posts";
import { getCurrentProfile } from "@/lib/profiles/get-current-profile";
import { formatCurrentRank } from "@/lib/profiles/profile-editor";

import { LFGFeedFiltersPanel } from "./lfg-feed-filters-panel";
import { LFGGameModePicker } from "./lfg-game-mode-picker";
import { LFGRolePicker, type LFGRoleOption } from "./lfg-role-picker";
import { LFGPostList } from "./lfg-post-list";
import { PostTitleField } from "./post-title-field";

type LFGPageShellProps = {
  description: string;
  emptyStateDescription?: string;
  emptyStateTitle?: string;
  filtersDescription?: string;
  helperText?: string;
  message?: string;
  messageType?: string;
  feedFilters?: LFGFeedFilters;
  title: string;
  type?: LFGType;
};

type LFGPageData = {
  posts: Awaited<ReturnType<typeof getActiveLFGPosts>>;
  postsErrorMessage: string | null;
  roleOptions: LFGRoleOption[];
};

function getMissingProfileRequirements(profile: {
  platform: string | null;
  region: string | null;
  timezone: string | null;
}) {
  const missingFields: string[] = [];

  if (!profile.platform) {
    missingFields.push("platform");
  }

  if (!profile.region) {
    missingFields.push("region");
  }

  if (!profile.timezone) {
    missingFields.push("server");
  }

  return missingFields;
}

function formatMissingFields(fields: string[]) {
  if (fields.length === 0) {
    return "";
  }

  if (fields.length === 1) {
    return fields[0];
  }

  if (fields.length === 2) {
    return `${fields[0]} and ${fields[1]}`;
  }

  return `${fields.slice(0, -1).join(", ")}, and ${fields[fields.length - 1]}`;
}

function LFGFiltersBar({ description }: { description: string }) {
  return (
    <section className="px-5 py-5 sm:px-6">
      <div className="flex min-h-16 flex-col justify-center rounded-[18px] border border-white/[0.07] bg-white/[0.02] px-4 py-3 shadow-[0_16px_36px_rgba(0,0,0,0.14),inset_0_1px_0_rgba(255,255,255,0.04)] sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-white/[0.05] text-zinc-400">
            <FilterIcon className="h-4 w-4" />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-zinc-100">Browse Feed</h2>
            <p className="mt-0.5 text-sm text-zinc-500">{description}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function LFGActionNotice({
  ctaHref,
  ctaLabel,
  description,
  title,
}: {
  ctaHref: string;
  ctaLabel: string;
  description: string;
  title: string;
}) {
  return (
    <div className="mt-4 rounded-[20px] border border-white/[0.07] bg-white/[0.04] p-4 shadow-[0_18px_40px_rgba(0,0,0,0.18),inset_0_1px_0_rgba(255,255,255,0.04)]">
      <h3 className="text-sm font-semibold text-zinc-100">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-zinc-400">{description}</p>
      <Link
        href={ctaHref}
        className="mt-4 inline-flex h-10 items-center rounded-full bg-white/[0.07] px-4 text-sm font-semibold text-zinc-200 transition hover:bg-white/[0.11] hover:text-zinc-50"
      >
        {ctaLabel}
      </Link>
    </div>
  );
}

function buildRoleOptions(
  competitiveProfile: Awaited<ReturnType<typeof getCompetitiveProfile>>,
  heroPools: Awaited<ReturnType<typeof getProfileHeroPools>>
): LFGRoleOption[] {
  return COMPETITIVE_ROLE_OPTIONS.map((role) => {
    const roleProfile =
      competitiveProfile.roles.find((candidate) => candidate.role === role) ?? null;
    const heroPool = heroPools.heroPicks[role]
      .map((heroId) => HERO_ROSTER.find((hero) => hero.id === heroId) ?? null)
      .filter((hero): hero is (typeof HERO_ROSTER)[number] => Boolean(hero));

    return {
      heroPool,
      isConfigured: Boolean(roleProfile),
      rankLabel: roleProfile
        ? formatCurrentRank(roleProfile.rankTier, roleProfile.rankDivision)
        : "Not set",
      rankTier: roleProfile?.rankTier ?? null,
      role,
    };
  });
}

async function getLFGPageData(
  type: LFGType,
  profileId: string | null,
  feedFilters?: LFGFeedFilters
): Promise<LFGPageData> {
  const postsResult = await getActiveLFGPosts(type, feedFilters)
    .then((posts) => ({ posts, postsErrorMessage: null }))
    .catch(() => ({
      posts: [],
      postsErrorMessage: "Try refreshing in a moment.",
    }));

  if (!profileId) {
    return {
      posts: postsResult.posts,
      postsErrorMessage: postsResult.postsErrorMessage,
      roleOptions: [],
    };
  }

  const [competitiveProfile, heroPools] = await Promise.all([
    getCompetitiveProfile(profileId),
    getProfileHeroPools(profileId),
  ]);

  return {
    posts: postsResult.posts,
    postsErrorMessage: postsResult.postsErrorMessage,
    roleOptions: buildRoleOptions(competitiveProfile, heroPools),
  };
}

export async function LFGPageShell({
  description,
  emptyStateDescription = "Create a post to start the conversation.",
  emptyStateTitle = "No posts yet",
  filtersDescription = "New posts appear here as players create listings in this section.",
  helperText,
  message,
  messageType,
  feedFilters,
  title,
  type,
}: LFGPageShellProps) {
  const { profile, user } = await getCurrentProfile();
  const inlineMessage = messageType === "success" ? undefined : message;
  const pageData = type
    ? await getLFGPageData(type, profile?.id ?? null, feedFilters)
    : {
        posts: [],
        postsErrorMessage: null,
        roleOptions: [],
      };
  const hasConfiguredRole = pageData.roleOptions.some(
    (roleOption) => roleOption.isConfigured
  );
  const profileSummary = {
    region: profile?.region ?? "Not set",
    timezone: profile?.timezone ?? "Not set",
  };
  const missingProfileRequirements = profile
    ? getMissingProfileRequirements({
        platform: profile.platform ?? null,
        region: profile.region ?? null,
        timezone: profile.timezone ?? null,
      })
    : [];
  const profileSetupHref =
    profile?.username ? `/u/${profile.username}?edit=profile` : "/account";
  const sectionHref = type ? `/${type}` : "/lfg";
  const visiblePostCount = pageData.posts.length;
  const displayTitle = type ? `/ ${title}` : title;

  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-5 text-zinc-100 sm:px-6 sm:py-7">
      {messageType === "success" ? (
        <AuthMessage message={message} type={messageType} variant="toast" />
      ) : null}
      <PageContainer className="flex flex-col gap-2.5">
        <section className="rounded-[28px]">
          <div className="overflow-hidden rounded-[28px] bg-zinc-950">
            <header className="px-5 py-5 sm:px-6 sm:py-6">
              <AuthMessage message={inlineMessage} type={messageType} />
              <div className="space-y-4">
                <div className="space-y-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-zinc-500">
                    LFG Channel
                  </p>
                  <h1 className="text-4xl font-semibold tracking-[-0.06em] text-zinc-50 sm:text-5xl">
                    {displayTitle}
                  </h1>
                </div>
                {type ? (
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs font-medium uppercase tracking-[0.14em] text-zinc-500">
                    <span>{visiblePostCount} active listings</span>
                  </div>
                ) : null}
                <p className="max-w-xl text-sm leading-6 text-zinc-400">
                  {description}
                </p>
                {helperText ? (
                  <p className="text-sm leading-6 text-zinc-500">
                    {helperText}
                  </p>
                ) : null}
              </div>

              {type ? (
                <section className="mt-7">
                  {!user ? (
                    <LFGActionNotice
                      ctaHref="/login"
                      ctaLabel="Log In"
                      description="Sign in with Discord to create a post in this section."
                      title="Log in to post"
                    />
                  ) : !profile ? (
                    <LFGActionNotice
                      ctaHref="/onboarding"
                      ctaLabel="Finish Onboarding"
                      description="Finish your overclock.lol profile first so your post can be attached to your public player page."
                      title="Complete your profile first"
                    />
                  ) : missingProfileRequirements.length > 0 ? (
                    <LFGActionNotice
                      ctaHref={profileSetupHref}
                      ctaLabel="Open Profile Editor"
                      description={`Add your ${formatMissingFields(
                        missingProfileRequirements
                      )} before creating a post in this section. This opens your profile editor directly.`}
                      title="Complete your setup before posting"
                    />
                  ) : !hasConfiguredRole ? (
                    <LFGActionNotice
                      ctaHref="/account/competitive"
                      ctaLabel="Set Up Competitive Profile"
                      description="Set up at least one competitive role before creating a post in this section."
                      title="Competitive profile required"
                    />
                  ) : (
                    <form
                      action={createLFGPost}
                      className="rounded-[22px] border border-white/[0.07] bg-white/[0.04] px-4 py-5 shadow-[0_18px_50px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.04)] sm:px-5 sm:py-6"
                    >
                      <h2 className="text-2xl font-semibold tracking-[-0.04em] text-zinc-50 sm:text-[2rem]">
                        Create a Post
                      </h2>
                      <input type="hidden" name="lfg_type" value={type} />
                      <PostTitleField />
                      {(type === "duos" || type === "stacks") ? (
                        <LFGGameModePicker />
                      ) : null}
                      <LFGRolePicker
                        profileSummary={profileSummary}
                        roleOptions={pageData.roleOptions}
                        setupHref="/account/competitive"
                      />
                    </form>
                  )}
                </section>
              ) : null}
            </header>

            {type ? (
              <>
                {type === "duos" || type === "stacks" ? (
                  <LFGFeedFiltersPanel
                    selectedFilters={feedFilters}
                  />
                ) : (
                  <LFGFiltersBar description={filtersDescription} />
                )}
                <LFGPostList
                  currentProfileId={profile?.id ?? null}
                  emptyStateDescription={emptyStateDescription}
                  emptyStateTitle={emptyStateTitle}
                  errorMessage={pageData.postsErrorMessage}
                  posts={pageData.posts}
                  retryHref={sectionHref}
                />
              </>
            ) : null}
          </div>
        </section>
      </PageContainer>
    </main>
  );
}
