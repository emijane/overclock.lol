import { Suspense } from "react";
import Link from "next/link";
import { ChevronLeftIcon, FilterIcon, PlusIcon, SearchIcon } from "lucide-react";

import { PageContainer } from "@/components/app-shell/page-container";
import { PageReveal } from "@/components/app-shell/page-reveal";
import { createLFGPost } from "@/app/lfg/actions";
import { AuthMessage } from "@/app/login/components";
import { getCompetitiveProfile } from "@/lib/competitive/competitive-profile";
import { COMPETITIVE_ROLE_OPTIONS } from "@/lib/competitive/competitive-profile-types";
import { getProfileHeroPools } from "@/lib/heroes/profile-hero-pools";
import { HERO_ROSTER } from "@/lib/heroes/hero-roster";
import {
  LFG_SEARCH_MAX_CHARACTERS,
  LFG_SEARCH_MIN_CHARACTERS,
  type LFGFeedFilters,
} from "@/lib/lfg/lfg-feed-filters";
import { hasActiveLFGFeedFilters } from "@/lib/lfg/lfg-feed-filters";
import type { LFGType } from "@/lib/lfg/lfg-post-types";
import {
  getActiveLFGPostCountsByRole,
  getActiveLFGPosts,
} from "@/lib/lfg/posts";
import { getLFGPostInviteStates } from "@/lib/matches/play-invites";
import { getStackRequestStatesForPosts } from "@/lib/lfg/stack-requests";
import { getCurrentProfile } from "@/lib/profiles/get-current-profile";
import { formatCurrentRank } from "@/lib/profiles/profile-editor";

import { LFGFeedFiltersPanel } from "./lfg-feed-filters-panel";
import { LFGGameModePicker } from "./lfg-game-mode-picker";
import { LFGRolePicker, type LFGRoleOption } from "./lfg-role-picker";
import { LFGPostList } from "./lfg-post-list";
import { LFGSidebar } from "./lfg-sidebar";
import { PostTitleField } from "./post-title-field";

type LFGPageShellProps = {
  animateOnLoad?: boolean;
  composerMode?: "cta" | "inline" | "none";
  createPostHref?: string;
  breadcrumbHref?: string;
  breadcrumbLabel?: string;
  description: string;
  emptyStateDescription?: string;
  emptyStateTitle?: string;
  filtersDescription?: string;
  helperText?: string;
  message?: string;
  messageType?: string;
  feedFilters?: LFGFeedFilters;
  showFeed?: boolean;
  title: string;
  type?: LFGType;
};

type LFGPageData = {
  activePostCounts: Awaited<ReturnType<typeof getActiveLFGPostCountsByRole>>;
  competitiveProfile: Awaited<ReturnType<typeof getCompetitiveProfile>> | null;
  posts: Awaited<ReturnType<typeof getActiveLFGPosts>>;
  postsErrorMessage: string | null;
  roleOptions: LFGRoleOption[];
};

function getMissingProfileRequirements(profile: {
  competitivePlatform: string | null;
  region: string | null;
  timezone: string | null;
}) {
  const missingFields: string[] = [];

  if (!profile.competitivePlatform) {
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
      <div className="flex min-h-16 flex-col justify-center rounded-[12px] border border-white/[0.06] bg-white/[0.02] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="oc-profile-icon-button grid h-9 w-9 place-items-center text-zinc-400">
            <FilterIcon className="h-4 w-4" />
          </span>
          <div>
            <h2 className="oc-profile-display text-sm font-semibold text-zinc-100">
              Browse Feed
            </h2>
            <p className="oc-profile-meta mt-0.5 text-[11px]">{description}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function LFGSearchBar({
  feedFilters,
  type,
}: {
  feedFilters?: LFGFeedFilters;
  type: LFGType;
}) {
  return (
    <form action={`/${type}`} className="mt-5 sm:mt-6">
      <div className="flex items-center gap-2.5 rounded-[10px] border border-white/[0.06] bg-white/[0.02] px-3 py-2">
        <span className="oc-profile-icon-button grid h-7 w-7 shrink-0 place-items-center text-zinc-500">
          <SearchIcon className="h-3.5 w-3.5" />
        </span>
        <input
          type="search"
          name="search"
          defaultValue={feedFilters?.search ?? ""}
          maxLength={LFG_SEARCH_MAX_CHARACTERS}
          placeholder={`Search ${type} posts`}
          className="duos-search-input oc-profile-display h-7 min-w-0 flex-1 bg-transparent text-[13px] font-medium text-zinc-100 outline-none placeholder:text-zinc-500"
        />
        {feedFilters?.mode ? (
          <input type="hidden" name="mode" value={feedFilters.mode} />
        ) : null}
        {feedFilters?.role ? (
          <input type="hidden" name="role" value={feedFilters.role} />
        ) : null}
        {feedFilters?.lookingFor ? (
          <input type="hidden" name="looking_for" value={feedFilters.lookingFor} />
        ) : null}
        {feedFilters?.minRank ? (
          <input type="hidden" name="min_rank" value={feedFilters.minRank} />
        ) : null}
        {feedFilters?.maxRank ? (
          <input type="hidden" name="max_rank" value={feedFilters.maxRank} />
        ) : null}
        {feedFilters?.region ? (
          <input type="hidden" name="region" value={feedFilters.region} />
        ) : null}
      </div>
      <p className="oc-profile-meta mt-2 px-1 text-[11px]">
        Search uses {LFG_SEARCH_MIN_CHARACTERS}-{LFG_SEARCH_MAX_CHARACTERS} characters.
      </p>
    </form>
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
    <div className="mt-4 rounded-[12px] border border-white/[0.06] bg-white/[0.02] p-4">
      <h3 className="oc-profile-display text-sm font-semibold text-zinc-100">{title}</h3>
      <p className="oc-profile-meta mt-2 text-[11px] leading-5 text-zinc-400">{description}</p>
      <Link
        href={ctaHref}
        className="oc-profile-display mt-4 inline-flex h-9 items-center rounded-full border border-white/[0.06] bg-white/[0.03] px-3.5 text-[13px] font-semibold text-zinc-200 transition hover:border-white/[0.12] hover:bg-white/[0.06] hover:text-zinc-50"
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
    const heroPool = (heroPools.heroPicks[role] ?? [])
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
      activePostCounts: { tank: 0, dps: 0, support: 0 },
      competitiveProfile: null,
      posts: postsResult.posts,
      postsErrorMessage: postsResult.postsErrorMessage,
      roleOptions: [],
    };
  }

  const [activePostCounts, competitiveProfile, heroPools] = await Promise.all([
    getActiveLFGPostCountsByRole({ lfgType: type, profileId }).catch(() => ({ tank: 0, dps: 0, support: 0 })),
    getCompetitiveProfile(profileId).catch(() => null),
    getProfileHeroPools(profileId).catch(() => ({ heroPicks: { tank: [], dps: [], support: [] }, roles: [] })),
  ]);

  return {
    activePostCounts,
    competitiveProfile,
    posts: postsResult.posts,
    postsErrorMessage: postsResult.postsErrorMessage,
    roleOptions: competitiveProfile ? buildRoleOptions(competitiveProfile, heroPools) : [],
  };
}

export async function LFGPageShell({
  animateOnLoad = false,
  composerMode = "inline",
  createPostHref,
  breadcrumbHref,
  breadcrumbLabel,
  description,
  emptyStateDescription = "Create a post to start the conversation.",
  emptyStateTitle = "No posts yet",
  filtersDescription = "New posts appear here as players create listings in this section.",
  helperText,
  message,
  messageType,
  feedFilters,
  showFeed = true,
  title,
  type,
}: LFGPageShellProps) {
  const { profile, user } = await getCurrentProfile();
  const shouldShowComposer = Boolean(type && composerMode === "inline");
  const shouldShowFeed = Boolean(type && showFeed);
  const emptyPageData: LFGPageData = {
    activePostCounts: { tank: 0, dps: 0, support: 0 },
    competitiveProfile: null,
    posts: [],
    postsErrorMessage: null,
    roleOptions: [],
  };
  const pageData =
    type && shouldShowFeed
      ? await getLFGPageData(type, profile?.id ?? null, feedFilters)
      : emptyPageData;
  const composerOnlyProfile =
    shouldShowComposer && !shouldShowFeed && profile?.id
      ? await Promise.all([
          getCompetitiveProfile(profile.id),
          getProfileHeroPools(profile.id),
        ])
      : null;
  const composerRoleOptions = composerOnlyProfile
    ? buildRoleOptions(composerOnlyProfile[0], composerOnlyProfile[1])
    : pageData.roleOptions;
  const competitiveProfileForComposer =
    shouldShowComposer && profile?.id
      ? composerOnlyProfile
        ? composerOnlyProfile[0]
        : pageData.competitiveProfile
      : null;
  const hasConfiguredRole = composerRoleOptions.some(
    (roleOption) => roleOption.isConfigured
  );
  const profileSummary = {
    region: profile?.region ?? "Not set",
    timezone: profile?.timezone ?? "Not set",
  };
  const missingProfileRequirements = profile
    ? getMissingProfileRequirements({
        competitivePlatform: competitiveProfileForComposer?.platform ?? null,
        region: profile.region ?? null,
        timezone: profile.timezone ?? null,
      })
    : [];
  const profileSetupHref = "/account/competitive";
  const profileSetupDescriptionSuffix =
    " This opens your competitive profile settings directly.";
  const profileSetupCtaLabel = "Open Competitive Profile";
  const sectionHref = type ? `/${type}` : "/lfg";
  const visiblePostCount = pageData.posts.length;
  const resolvedCreatePostHref = createPostHref ?? (type ? `/${type}/create` : "/lfg");
  const guestCreateHref = type ? `/login?next=/${type}/create` : "/login";
  const isComposerOnlyPage = shouldShowComposer && !shouldShowFeed;
  const displayTitle = isComposerOnlyPage ? `/ ${title}` : title;
  const isDuosPage = type === "duos";
  const isStacksPage = type === "stacks";
  const useSidebarLayout = shouldShowFeed && (type === "duos" || type === "stacks");
  const isStacksFeed = shouldShowFeed && type === "stacks";
  const [inviteStates, stackRequestStates] = await Promise.all([
    shouldShowFeed
      ? getLFGPostInviteStates({
          currentProfileId: profile?.id ?? null,
          posts: pageData.posts.map((post) => ({
            id: post.id,
            profileId: post.profileId,
          })),
        }).catch(() => ({}))
      : Promise.resolve({}),
    isStacksFeed && profile?.id
      ? getStackRequestStatesForPosts({
          currentProfileId: profile.id,
          postIds: pageData.posts.map((p) => p.id),
        }).catch(() => ({}))
      : Promise.resolve({}),
  ]);

  return (
    <main
      className={`relative px-4 text-zinc-100 sm:px-6 ${
        isComposerOnlyPage
          ? "pb-0 pt-2 sm:pb-0 sm:pt-3"
          : isDuosPage
            ? "oc-atmosphere-bg flex-1 py-6 sm:py-8"
            : "flex-1 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.04),transparent_30%),radial-gradient(circle_at_20%_0%,rgba(56,189,248,0.08),transparent_24%),radial-gradient(circle_at_80%_10%,rgba(255,255,255,0.03),transparent_18%),#09090b] py-6 sm:py-8"
      }`}
    >
      {isDuosPage ? (
        <>
          <div aria-hidden="true" className="oc-atmosphere-dots-primary pointer-events-none absolute inset-0" />
          <div aria-hidden="true" className="oc-atmosphere-dots-secondary pointer-events-none absolute inset-0" />
          <div aria-hidden="true" className="oc-atmosphere-spotlight pointer-events-none absolute inset-0" />
          <div aria-hidden="true" className="oc-atmosphere-vignette pointer-events-none absolute inset-0" />
        </>
      ) : (
        <>
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.7)_0.6px,transparent_0.95px)] bg-[length:11px_11px] opacity-68 [mask-image:radial-gradient(circle_at_34%_12%,black_0,black_12%,transparent_28%)]"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(224,242,254,0.68)_0.6px,transparent_0.95px)] bg-[length:11px_11px] opacity-64 [mask-image:radial-gradient(circle_at_72%_62%,black_0,black_10%,transparent_24%)]"
          />
        </>
      )}
      <AuthMessage message={message} type={messageType} variant="toast" />
      <PageContainer
        className={`relative z-10 ${
          isComposerOnlyPage
            ? "flex flex-col gap-2"
            : useSidebarLayout
              ? "flex items-start gap-6"
              : "flex flex-col gap-3"
        }`}
        maxWidthClassName={isComposerOnlyPage ? "max-w-4xl" : "max-w-[120rem]"}
      >
        {useSidebarLayout && type ? (
          <Suspense fallback={<div className="hidden w-56 shrink-0 lg:block" />}>
            <LFGSidebar
              createPostHref={resolvedCreatePostHref}
              isLoggedIn={Boolean(user)}
              selectedFilters={feedFilters}
              tone={isDuosPage ? "duos" : "default"}
              type={type}
            />
          </Suspense>
        ) : null}
        <section
          className={`${useSidebarLayout ? "min-w-0 flex-1" : ""} ${
            isDuosPage ? "oc-profile-shell rounded-[12px] bg-[#111111] p-px" : "rounded-[28px]"
          }`}
        >
          <div className={isDuosPage ? "overflow-hidden rounded-[11px] bg-[#090909]" : "overflow-hidden rounded-[28px]"}>
            <header
              className={`px-5 sm:px-6 ${
                isComposerOnlyPage ? "py-3 sm:py-4" : isDuosPage ? "py-4 sm:py-5" : "py-5 sm:py-7"
              }`}
            >
              <div className={isComposerOnlyPage ? "space-y-3" : "space-y-5"}>
                <PageReveal
                  className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"
                  delay={0}
                  disabled={!(animateOnLoad && isComposerOnlyPage)}
                >
                  <div className={isComposerOnlyPage ? "space-y-2" : "space-y-3"}>
                    {breadcrumbHref && breadcrumbLabel ? (
                      <Link
                        href={breadcrumbHref}
                        className={
                          isDuosPage
                            ? "oc-profile-meta inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] transition hover:text-zinc-300"
                            : "inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.24em] text-zinc-500 transition hover:text-zinc-300"
                        }
                      >
                        <ChevronLeftIcon className="h-3.5 w-3.5 shrink-0" />
                        {breadcrumbLabel}
                      </Link>
                    ) : null}
                    <h1
                      className={
                        isDuosPage
                          ? "oc-profile-display text-[34px] font-bold leading-[0.98] tracking-[-0.045em] text-zinc-50 sm:text-[40px]"
                          : `font-semibold tracking-[-0.075em] text-zinc-50 ${
                              isComposerOnlyPage || type === "stacks"
                                ? "text-4xl sm:text-5xl"
                                : "text-5xl sm:text-6xl"
                            }`
                      }
                    >
                      {displayTitle}
                    </h1>
                  </div>
                  {type && composerMode === "cta" && !useSidebarLayout ? (
                    <Link
                      href={user ? resolvedCreatePostHref : guestCreateHref}
                      className={`oc-profile-display inline-flex h-9 shrink-0 items-center gap-2 self-start rounded-full border px-3.5 text-[13px] font-semibold text-zinc-100 transition-all duration-200 ${
                        isDuosPage
                          ? "border-white/[0.06] bg-white/[0.03] hover:border-white/[0.12] hover:bg-white/[0.06] hover:text-white"
                          : "border-white/[0.08] bg-[#05070b] hover:border-white/[0.12] hover:bg-[#080b10] hover:text-white"
                      }`}
                    >
                      <PlusIcon className="h-4 w-4" />
                      {user ? "Create Post" : "Log in to Post"}
                    </Link>
                  ) : shouldShowComposer && user && profile && missingProfileRequirements.length === 0 && hasConfiguredRole ? (
                    <div className="flex items-center gap-2 self-start">
                      <Link
                        href={profileSetupHref}
                        className={`oc-profile-display inline-flex h-8 shrink-0 items-center rounded-full border px-3 text-[12px] font-semibold text-zinc-400 transition hover:text-zinc-200 ${
                          isDuosPage
                            ? "border-white/[0.06] bg-white/[0.03] hover:border-white/[0.12] hover:bg-white/[0.06]"
                            : "border-white/[0.07] bg-white/2.5 hover:border-white/10 hover:bg-white/4"
                        }`}
                      >
                        Edit profile
                      </Link>
                      <Link
                        href="/account/posts"
                        className={`oc-profile-display inline-flex h-8 shrink-0 items-center rounded-full border px-3 text-[12px] font-semibold text-zinc-400 transition hover:text-zinc-200 ${
                          isDuosPage
                            ? "border-white/[0.06] bg-white/[0.03] hover:border-white/[0.12] hover:bg-white/[0.06]"
                            : "border-white/[0.07] bg-white/2.5 hover:border-white/10 hover:bg-white/4"
                        }`}
                      >
                        Manage posts
                      </Link>
                    </div>
                  ) : null}
                </PageReveal>
                {description ? (
                  <p className={`max-w-xl leading-5 ${isDuosPage ? "oc-profile-meta text-[11px]" : "text-sm text-zinc-400"}`}>
                    {description}
                  </p>
                ) : null}
                {helperText ? (
                  <p className={isDuosPage ? "oc-profile-meta text-[11px] leading-5" : "text-sm leading-6 text-zinc-500"}>
                    {helperText}
                  </p>
                ) : null}
                {type === "duos" && shouldShowFeed ? (
                  <LFGSearchBar feedFilters={feedFilters} type={type} />
                ) : null}
              </div>

              {type && shouldShowComposer ? (
                <PageReveal
                  className={isComposerOnlyPage ? "mt-4" : "mt-8"}
                  delay={1}
                  disabled={!(animateOnLoad && isComposerOnlyPage)}
                >
                  {!user ? (
                    <LFGActionNotice
                      ctaHref="/login"
                      ctaLabel="Log in"
                      description="Sign in with Discord to create a post in this section."
                      title="Log in to post"
                    />
                  ) : !profile ? (
                    <LFGActionNotice
                      ctaHref="/onboarding"
                      ctaLabel="Finish onboarding"
                      description="Finish your overclock.lol profile first so your post can be attached to your public player page."
                      title="Complete your profile first"
                    />
                  ) : missingProfileRequirements.length > 0 ? (
                    <LFGActionNotice
                      ctaHref={profileSetupHref}
                      ctaLabel={profileSetupCtaLabel}
                      description={`Add your ${formatMissingFields(
                        missingProfileRequirements
                      )} before creating a post in this section.${profileSetupDescriptionSuffix}`}
                      title="Complete your setup before posting"
                    />
                  ) : !hasConfiguredRole ? (
                    <LFGActionNotice
                      ctaHref="/account/competitive"
                      ctaLabel="Set up competitive profile"
                      description="Set up at least one competitive role before creating a post in this section."
                      title="Competitive profile required"
                    />
                  ) : (
                    <form
                      action={createLFGPost}
                      className={`px-4 py-4 sm:px-5 sm:py-4.5 ${
                        isDuosPage
                          ? "rounded-[12px] border border-white/[0.06] bg-white/[0.02]"
                          : "rounded-[24px] border border-white/[0.08] bg-[#05070b] shadow-[0_24px_70px_rgba(0,0,0,0.24),inset_0_1px_0_rgba(255,255,255,0.04)]"
                      }`}
                    >
                      <input type="hidden" name="lfg_type" value={type} />
                      <PostTitleField
                        placeholder={
                          isStacksPage
                            ? "Building a chill ranked stack for tonight..."
                            : undefined
                        }
                        tone={isDuosPage ? "duos" : "default"}
                      />
                      <LFGGameModePicker tone={isDuosPage ? "duos" : "default"} />
                      <LFGRolePicker
                        profileSummary={profileSummary}
                        roleOptions={composerRoleOptions}
                        setupHref="/account/competitive"
                        tone={isDuosPage ? "duos" : "default"}
                      />
                    </form>
                  )}
                </PageReveal>
              ) : null}
            </header>

            {shouldShowFeed ? (
              <>
                {useSidebarLayout ? (
                  <div className="lg:hidden">
                    <Suspense fallback={<div className="h-14" />}>
                      <LFGFeedFiltersPanel
                        activeCount={visiblePostCount}
                        selectedFilters={feedFilters}
                        tone={isDuosPage ? "duos" : "default"}
                      />
                    </Suspense>
                  </div>
                ) : type === "duos" || type === "stacks" ? (
                  <Suspense fallback={<div className="h-14" />}>
                    <LFGFeedFiltersPanel
                      activeCount={visiblePostCount}
                      selectedFilters={feedFilters}
                      tone={isDuosPage ? "duos" : "default"}
                    />
                  </Suspense>
                ) : (
                  <LFGFiltersBar description={filtersDescription} />
                )}
                <LFGPostList
                  cardClassName={
                    undefined
                  }
                  currentProfileId={profile?.id ?? null}
                  emptyStateDescription={emptyStateDescription}
                  emptyStateTitle={emptyStateTitle}
                  errorMessage={pageData.postsErrorMessage}
                  hasActiveFilters={hasActiveLFGFeedFilters(feedFilters)}
                  inviteStates={inviteStates}
                  layout={type === "duos" || type === "stacks" ? "grid-3" : "list"}
                  posts={pageData.posts}
                  retryHref={sectionHref}
                  stackRequestStates={stackRequestStates}
                  tone={isDuosPage ? "duos" : "default"}
                  viewerState={!user ? "guest" : profile ? "signed_in" : "profile_required"}
                />
              </>
            ) : null}
          </div>
        </section>
      </PageContainer>
    </main>
  );
}
