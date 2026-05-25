import { Suspense } from "react";
import Link from "next/link";
import { ChevronLeftIcon, FilterIcon, PlusIcon, SearchIcon } from "lucide-react";

import { PageContainer } from "@/components/app-shell/page-container";
import { PageReveal } from "@/components/app-shell/page-reveal";
import { AuthMessage } from "@/components/auth/auth-message";
import { createLFGPost } from "@/features/lfg/actions";
import { STACKS_PLACEHOLDER_POSTS } from "@/features/lfg/dev-fixtures";
import { getDuosFeedInitialPage } from "@/features/lfg/duos-feed";
import { getCompetitiveProfile } from "@/lib/competitive/competitive-profile";
import { COMPETITIVE_ROLE_LABELS } from "@/lib/competitive/competitive-role-labels";
import { COMPETITIVE_ROLE_OPTIONS } from "@/lib/competitive/competitive-profile-types";
import { getProfileHeroPools } from "@/lib/heroes/profile-hero-pools";
import { HERO_ROSTER } from "@/lib/heroes/hero-roster";
import {
  LFG_SEARCH_MAX_CHARACTERS,
  type LFGFeedFilters,
} from "@/lib/lfg/lfg-feed-filters";
import { hasActiveLFGFeedFilters } from "@/lib/lfg/lfg-feed-filters";
import { getLFGGameModeLabel, type LFGType } from "@/lib/lfg/lfg-post-types";
import {
  getActiveStackPostById,
  getCurrentActiveStackPostIdForProfile,
} from "@/lib/lfg/posts/posts-queries";
import { getLFGFeedPageDto } from "@/lib/pages/lfg-feed-page-dto";
import { duosPerfLog, stacksPerfLog, stacksPerfStart } from "@/lib/dev/perf-log";
import {
  getCurrentProfile,
  getCurrentProfileIdentity,
  getCurrentUserId,
} from "@/lib/profiles/get-current-profile";
import { formatCurrentRank } from "@/lib/profiles/profile-editor";

import {
  CurrentStackFallbackPanel,
  CurrentStackPanel,
  isBlockedByCurrentStackMessage,
} from "./current-stack-panel";
import { LFGFeedFiltersPanel } from "./lfg-feed-filters-panel";
import { LFGGameModePicker } from "./lfg-game-mode-picker";
import { DuosInfiniteFeed } from "./duos-infinite-feed";
import { LFGRolePicker, type LFGRoleOption } from "./lfg-role-picker";
import { LFGPostList } from "./lfg-post-list";
import { LFGSidebar } from "./lfg-sidebar";
import { PostTitleField } from "./post-title-field";

type LFGPageShellProps = {
  animateOnLoad?: boolean;
  activeStackPostId?: string | null;
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
  useFixtures?: boolean;
};

type LFGPageData = {
  activePostCounts: Record<"tank" | "dps" | "support", number>;
  competitiveProfile: Awaited<ReturnType<typeof getCompetitiveProfile>> | null;
  currentStackPostId: string | null;
  hasMorePosts: boolean;
  inviteStates: Record<string, "invite_to_play" | "invite_sent" | "connected">;
  nextCursor: { createdAt: string; id: string } | null;
  posts: import("@/lib/lfg/lfg-post-types").LFGPost[];
  postsErrorMessage: string | null;
  roleOptions: LFGRoleOption[];
  stackRequestStates: Record<string, "none" | "pending" | "accepted" | "declined">;
};

function logLFGRoutePerf(
  type: LFGType,
  label: string,
  start: number,
  rows?: number
) {
  if (type === "stacks") {
    stacksPerfLog(label, start, rows);
    return;
  }

  if (type === "duos") {
    duosPerfLog(label, start, rows);
  }
}

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

function buildDuosHeaderSummary(
  visiblePostCount: number,
  feedFilters?: LFGFeedFilters
) {
  const summaryParts = [`Showing ${visiblePostCount} posts`];
  const filterParts = [
    feedFilters?.region ?? null,
    feedFilters?.mode ? getLFGGameModeLabel(feedFilters.mode) : null,
    feedFilters?.role ? `Role: ${COMPETITIVE_ROLE_LABELS[feedFilters.role]}` : null,
    feedFilters?.lookingFor ? `Needs: ${COMPETITIVE_ROLE_LABELS[feedFilters.lookingFor]}` : null,
  ].filter((value): value is string => Boolean(value));

  if (filterParts.length > 0) {
    summaryParts.push(...filterParts.slice(0, 3));
  } else {
    summaryParts.push("All regions", "All roles");
  }

  return summaryParts.join(" • ");
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
  useFixtures = false,
}: {
  feedFilters?: LFGFeedFilters;
  type: LFGType;
  useFixtures?: boolean;
}) {
  return (
    <form action={`/${type}`} className="w-[18rem] shrink-0">
      <div className="flex items-center gap-2 rounded-[10px] border border-white/[0.04] bg-white/[0.015] px-2 py-1.5">
        <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full border border-white/[0.04] bg-white/[0.02] text-zinc-500">
          <SearchIcon className="h-3 w-3" />
        </span>
        <input
          type="search"
          name="search"
          defaultValue={feedFilters?.search ?? ""}
          maxLength={LFG_SEARCH_MAX_CHARACTERS}
          placeholder={`Search ${type} posts`}
          className="duos-search-input oc-profile-display h-5 min-w-0 flex-1 bg-transparent text-[11px] font-medium text-zinc-100 outline-none placeholder:text-zinc-500"
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
        {useFixtures ? <input type="hidden" name="fixtures" value="1" /> : null}
      </div>
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
        className="oc-profile-display mt-4 inline-flex h-9 items-center rounded-[10px] border border-white/[0.06] bg-white/[0.03] px-3.5 text-[13px] font-semibold text-zinc-200 transition hover:border-white/[0.12] hover:bg-white/[0.06] hover:text-zinc-50"
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
  viewerProfileId: string | null,
  feedFilters?: LFGFeedFilters,
  useFixtures = false
): Promise<LFGPageData> {
  if (type === "duos") {
    const tDuosPage = Date.now();
    const dtoResult = await getDuosFeedInitialPage({
      filters: feedFilters,
      useFixtures,
      viewerProfileId,
    })
      .then((dto) => ({ dto, postsErrorMessage: null }))
      .catch(() => ({
        dto: null,
        postsErrorMessage: "Try refreshing in a moment.",
      }));
    logLFGRoutePerf(
      type,
      "getLFGPageData duos initial feed",
      tDuosPage,
      dtoResult.dto?.posts.length
    );

    return {
      activePostCounts: dtoResult.dto?.viewerBundle?.activePostCounts ?? {
        tank: 0,
        dps: 0,
        support: 0,
      },
      competitiveProfile: dtoResult.dto?.viewerBundle?.competitiveProfile ?? null,
      currentStackPostId: null,
      hasMorePosts: dtoResult.dto?.hasMore ?? false,
      inviteStates: dtoResult.dto?.inviteStates ?? {},
      nextCursor: dtoResult.dto?.nextCursor ?? null,
      posts: dtoResult.dto?.posts ?? [],
      postsErrorMessage: dtoResult.postsErrorMessage,
      roleOptions:
        dtoResult.dto?.viewerBundle?.competitiveProfile && dtoResult.dto.viewerBundle
          ? buildRoleOptions(
              dtoResult.dto.viewerBundle.competitiveProfile,
              dtoResult.dto.viewerBundle.heroPools
            )
          : [],
      stackRequestStates: {},
    };
  }

  if (useFixtures) {
    return {
      activePostCounts: { tank: 0, dps: 0, support: 0 },
      competitiveProfile: null,
      currentStackPostId: null,
      hasMorePosts: false,
      inviteStates: {},
      nextCursor: null,
      posts: STACKS_PLACEHOLDER_POSTS,
      postsErrorMessage: null,
      roleOptions: [],
      stackRequestStates: {},
    };
  }

  const tDto = Date.now();
  const [dtoResult, currentStackPostId] = await Promise.all([
    getLFGFeedPageDto({
      currentProfileId: viewerProfileId,
      filters: feedFilters,
      lfgType: type,
      viewerProfileId,
    })
      .then((dto) => ({ dto, postsErrorMessage: null }))
      .catch(() => ({
        dto: null,
        postsErrorMessage: "Try refreshing in a moment.",
      })),
    type === "stacks" && viewerProfileId
      ? getCurrentActiveStackPostIdForProfile(viewerProfileId).catch(() => null)
      : Promise.resolve(null),
  ]);
  logLFGRoutePerf(type, "getLFGPageData Promise.all dto+currentStackLookup", tDto, dtoResult.dto?.posts.length);

  if (!viewerProfileId) {
    return {
      activePostCounts: { tank: 0, dps: 0, support: 0 },
      competitiveProfile: null,
      currentStackPostId: null,
      hasMorePosts: false,
      inviteStates: dtoResult.dto?.inviteStates ?? {},
      nextCursor: null,
      posts: dtoResult.dto?.posts ?? [],
      postsErrorMessage: dtoResult.postsErrorMessage,
      roleOptions: [],
      stackRequestStates: dtoResult.dto?.stackRequestStates ?? {},
    };
  }

  const viewerBundle = dtoResult.dto?.viewerBundle ?? null;
  const activePostCounts = viewerBundle?.activePostCounts ?? {
    tank: 0,
    dps: 0,
    support: 0,
  };
  const competitiveProfile = viewerBundle?.competitiveProfile ?? null;
  const heroPools =
    viewerBundle?.heroPools ?? {
      heroPicks: { tank: [], dps: [], support: [] },
      roles: [],
    };

  return {
    activePostCounts,
    competitiveProfile,
    currentStackPostId,
    hasMorePosts: false,
    inviteStates: dtoResult.dto?.inviteStates ?? {},
    nextCursor: null,
    posts: dtoResult.dto?.posts ?? [],
    postsErrorMessage: dtoResult.postsErrorMessage,
    roleOptions: competitiveProfile ? buildRoleOptions(competitiveProfile, heroPools) : [],
    stackRequestStates: dtoResult.dto?.stackRequestStates ?? {},
  };
}

function CurrentStackPanelFallback() {
  return <div className="min-h-[104px]" />;
}

async function DeferredCurrentStackPanel({
  activeStackPostId,
  currentProfileId,
  showBlockedCreateCopy,
}: {
  activeStackPostId: string;
  currentProfileId: string;
  showBlockedCreateCopy: boolean;
}) {
  const tHydrate = stacksPerfStart();
  const currentStack = await getActiveStackPostById(activeStackPostId).catch(() => null);
  stacksPerfLog(
    "LFGPageShell current stack hydrate",
    tHydrate,
    currentStack ? 1 : 0
  );

  if (!currentStack) {
    return <CurrentStackFallbackPanel blockingPostId={activeStackPostId} />;
  }

  return (
    <CurrentStackPanel
      currentProfileId={currentProfileId}
      post={currentStack}
      showBlockedCreateCopy={showBlockedCreateCopy}
    />
  );
}

export async function LFGPageShell({
  animateOnLoad = false,
  activeStackPostId,
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
  useFixtures = false,
}: LFGPageShellProps) {
  const tPage = stacksPerfStart();
  const tProfile = stacksPerfStart();
  const shouldShowComposer = Boolean(type && composerMode === "inline");
  const shouldShowFeed = Boolean(type && showFeed);
  const needsFullProfile = shouldShowComposer;
  const emptyPageData: LFGPageData = {
    activePostCounts: { tank: 0, dps: 0, support: 0 },
    competitiveProfile: null,
    currentStackPostId: null,
    hasMorePosts: false,
    inviteStates: {},
    nextCursor: null,
    posts: [],
    postsErrorMessage: null,
    roleOptions: [],
    stackRequestStates: {},
  };
  const currentProfilePromise = (
    needsFullProfile ? getCurrentProfile() : getCurrentProfileIdentity()
  ).then((result) => {
    if (type) {
      const profileLabel = needsFullProfile
        ? "LFGPageShell getCurrentProfile"
        : "LFGPageShell getCurrentProfileIdentity";
      logLFGRoutePerf(type, profileLabel, tProfile, result.profile ? 1 : 0);
    }

    return result;
  });
  const feedViewerProfileIdPromise =
    type && shouldShowFeed ? getCurrentUserId() : Promise.resolve(null);
  const pageDataPromise =
    type && shouldShowFeed
      ? feedViewerProfileIdPromise.then((viewerProfileId) =>
          getLFGPageData(type, viewerProfileId, feedFilters, useFixtures)
        )
      : Promise.resolve(emptyPageData);
  const [{ profile, user }, pageData] = await Promise.all([
    currentProfilePromise,
    pageDataPromise,
  ]);
  const currentStackMembershipPostId =
    type === "stacks" ? pageData.currentStackPostId ?? null : null;
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
  const isDuosPage = type === "duos";
  const isStacksPage = type === "stacks";
  const resolvedCreatePostHref = createPostHref ?? (type ? `/${type}/create` : "/lfg");
  const guestCreateHref = type ? `/login?next=/${type}/create` : "/login";
  const isComposerOnlyPage = shouldShowComposer && !shouldShowFeed;
  const displayTitle = isComposerOnlyPage ? `/ ${title}` : title;
  const usesDuosFeedTone = isDuosPage || isStacksPage;
  const useSidebarLayout = shouldShowFeed && (type === "duos" || type === "stacks");
  const isStacksFeed = shouldShowFeed && type === "stacks";
  const inviteStates = shouldShowFeed ? pageData.inviteStates : {};
  const stackRequestStates =
    isStacksFeed && profile?.id ? pageData.stackRequestStates : {};
  const resolvedActiveStackPostId = activeStackPostId ?? currentStackMembershipPostId;
  const currentStackHref = resolvedActiveStackPostId
    ? `/stacks/${resolvedActiveStackPostId}`
    : null;
  const duosHeaderSummary =
    isDuosPage && shouldShowFeed ? buildDuosHeaderSummary(visiblePostCount, feedFilters) : null;
  const shouldShowCurrentStackPanel = Boolean(
    type === "stacks" && profile?.id && resolvedActiveStackPostId
  );
  const showBlockedCurrentStackCopy = isBlockedByCurrentStackMessage(message);
  const isBlockedFromStackCreate =
    type === "stacks" &&
    Boolean(profile?.id) &&
    (Boolean(resolvedActiveStackPostId) || showBlockedCurrentStackCopy);
  const shouldShowCurrentStackFallback =
    type === "stacks" &&
    Boolean(profile?.id) &&
    isBlockedFromStackCreate &&
    !resolvedActiveStackPostId;
  if (type) {
    logLFGRoutePerf(type, "LFGPageShell total data load", tPage, pageData.posts.length);
  }

  if (shouldShowCurrentStackFallback && process.env.NODE_ENV !== "production") {
    console.warn("[lfg] Current stack block mismatch", {
      activeStackPostId: resolvedActiveStackPostId ?? null,
      hasCurrentStack: Boolean(resolvedActiveStackPostId),
      message: message ?? null,
      profileId: profile?.id ?? null,
      type: type ?? null,
    });
  }

  return (
    <main
      className={`relative flex min-h-0 flex-col px-4 text-zinc-100 sm:px-6 ${
        isComposerOnlyPage
          ? "pb-0 pt-2 sm:pb-0 sm:pt-3"
          : usesDuosFeedTone
            ? "oc-atmosphere-bg flex-1 py-6 sm:py-8"
            : "flex-1 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.04),transparent_30%),radial-gradient(circle_at_20%_0%,rgba(56,189,248,0.08),transparent_24%),radial-gradient(circle_at_80%_10%,rgba(255,255,255,0.03),transparent_18%),#09090b] py-6 sm:py-8"
      }`}
    >
      {usesDuosFeedTone ? (
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
              ? `flex flex-1 lg:min-h-0 items-stretch ${usesDuosFeedTone ? "gap-4 xl:gap-5" : "gap-6"}`
              : "flex flex-col gap-3"
        }`}
        maxWidthClassName={
          isComposerOnlyPage
            ? "max-w-4xl"
            : usesDuosFeedTone
              ? "max-w-none"
              : "max-w-[120rem]"
        }
      >
        {useSidebarLayout && type ? (
          <Suspense fallback={<div className="hidden w-56 shrink-0 self-stretch lg:block" />}>
            <LFGSidebar
              createPostHref={resolvedCreatePostHref}
              currentStackHref={currentStackHref}
              hasActiveStack={isBlockedFromStackCreate}
              isLoggedIn={Boolean(user)}
              selectedFilters={feedFilters}
              tone={usesDuosFeedTone ? "duos" : "default"}
              type={type}
            />
          </Suspense>
        ) : null}
        <section
          className={`${useSidebarLayout ? `flex min-w-0 flex-1 min-h-0 flex-col ${isDuosPage ? "lg:self-start lg:sticky lg:top-8 lg:max-h-[calc(100vh-4rem)] lg:overflow-hidden" : "lg:self-start lg:sticky lg:top-8 lg:max-h-[calc(100vh-4rem)]"}` : ""} ${
            usesDuosFeedTone ? "" : "rounded-[28px]"
          }`}
        >
          <div
            className={
              usesDuosFeedTone
                ? "flex flex-1 min-h-0 flex-col overflow-hidden rounded-[10px] bg-[linear-gradient(180deg,rgba(255,255,255,0.012)_0%,rgba(255,255,255,0.006)_100%)]"
                : "flex flex-1 min-h-0 flex-col overflow-hidden rounded-[28px]"
            }
          >
            <header
              className={`relative z-10 shrink-0 px-5 sm:px-6 ${
                isComposerOnlyPage
                  ? "py-3 sm:py-4"
                  : usesDuosFeedTone
                    ? "py-2.5 sm:py-3"
                    : "py-5 sm:py-7"
              }`}
            >
              <div
                className={
                  isComposerOnlyPage ? "space-y-3" : usesDuosFeedTone ? "space-y-2" : "space-y-5"
                }
              >
                <PageReveal
                  className={
                    usesDuosFeedTone
                      ? "flex items-center justify-between gap-4"
                      : "flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"
                  }
                  delay={0}
                  disabled={!(animateOnLoad && isComposerOnlyPage)}
                >
                  <div className={isComposerOnlyPage ? "space-y-2" : "space-y-3"}>
                    {breadcrumbHref && breadcrumbLabel ? (
                      <Link
                        href={breadcrumbHref}
                        className={
                          usesDuosFeedTone
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
                        usesDuosFeedTone
                          ? "oc-profile-display text-[20px] font-bold tracking-[-0.03em] text-zinc-50 sm:text-[24px]"
                          : `font-semibold tracking-[-0.075em] text-zinc-50 ${
                              isComposerOnlyPage
                                ? "text-4xl sm:text-5xl"
                                : "text-5xl sm:text-6xl"
                            }`
                      }
                    >
                      {displayTitle}
                    </h1>
                  </div>
                  {usesDuosFeedTone && type && shouldShowFeed ? (
                    <LFGSearchBar feedFilters={feedFilters} type={type} useFixtures={useFixtures} />
                  ) : type && composerMode === "cta" && !useSidebarLayout ? (
                    type === "stacks" && user && isBlockedFromStackCreate ? (
                      currentStackHref ? (
                        <Link
                          href={currentStackHref}
                          className={`oc-profile-display inline-flex h-9 shrink-0 items-center gap-2 self-start rounded-[10px] border px-3.5 text-[13px] font-semibold text-zinc-100 transition-all duration-200 ${
                            usesDuosFeedTone
                              ? "border-white/[0.06] bg-white/[0.03] hover:border-white/[0.12] hover:bg-white/[0.06] hover:text-white"
                              : "border-white/[0.08] bg-[#05070b] hover:border-white/[0.12] hover:bg-[#080b10] hover:text-white"
                          }`}
                        >
                          View current stack
                        </Link>
                      ) : (
                        <span
                          className={`oc-profile-display inline-flex h-9 shrink-0 items-center self-start rounded-full border px-3.5 text-[13px] font-semibold text-zinc-500 ${
                            usesDuosFeedTone
                              ? "border-white/[0.06] bg-white/[0.03]"
                              : "border-white/[0.08] bg-[#05070b]"
                          }`}
                        >
                          You already have an active stack
                        </span>
                      )
                    ) : (
                      <Link
                        href={user ? resolvedCreatePostHref : guestCreateHref}
                        className={`oc-profile-display inline-flex h-9 shrink-0 items-center gap-2 self-start rounded-[10px] border px-3.5 text-[13px] font-semibold text-zinc-100 transition-all duration-200 ${
                          usesDuosFeedTone
                            ? "border-white/[0.06] bg-white/[0.03] hover:border-white/[0.12] hover:bg-white/[0.06] hover:text-white"
                            : "border-white/[0.08] bg-[#05070b] hover:border-white/[0.12] hover:bg-[#080b10] hover:text-white"
                        }`}
                      >
                        <PlusIcon className="h-4 w-4" />
                        {user ? "Create Post" : "Log in to Post"}
                      </Link>
                    )
                  ) : shouldShowComposer && user && profile && missingProfileRequirements.length === 0 && hasConfiguredRole ? (
                    <div className="flex items-center gap-2 self-start">
                      <Link
                        href={profileSetupHref}
                        className={`oc-profile-display inline-flex h-8 shrink-0 items-center rounded-[10px] border px-3 text-[12px] font-semibold text-zinc-400 transition hover:text-zinc-200 ${
                          usesDuosFeedTone
                            ? "border-white/[0.06] bg-white/[0.03] hover:border-white/[0.12] hover:bg-white/[0.06]"
                            : "border-white/[0.07] bg-white/2.5 hover:border-white/10 hover:bg-white/4"
                        }`}
                      >
                        Edit profile
                      </Link>
                      <Link
                        href="/account/posts"
                        className={`oc-profile-display inline-flex h-8 shrink-0 items-center rounded-[10px] border px-3 text-[12px] font-semibold text-zinc-400 transition hover:text-zinc-200 ${
                          usesDuosFeedTone
                            ? "border-white/[0.06] bg-white/[0.03] hover:border-white/[0.12] hover:bg-white/[0.06]"
                            : "border-white/[0.07] bg-white/2.5 hover:border-white/10 hover:bg-white/4"
                        }`}
                      >
                        Manage posts
                      </Link>
                    </div>
                    ) : null}
                  </PageReveal>
                {isDuosPage && shouldShowFeed && duosHeaderSummary ? (
                  <div className="flex flex-col gap-1 pt-1 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                    <p className="oc-profile-meta max-w-xl text-[11px] leading-5 text-zinc-400">
                      Find a ranked partner, warmup duo, or comms-first queue.
                    </p>
                    <p className="oc-profile-meta text-[11px] leading-5 text-zinc-500 sm:text-right">
                      {duosHeaderSummary}
                    </p>
                  </div>
                ) : null}
                {description ? (
                  <p
                    className={`max-w-xl leading-5 ${
                      usesDuosFeedTone ? "oc-profile-meta text-[11px]" : "text-sm text-zinc-400"
                    }`}
                  >
                    {description}
                  </p>
                ) : null}
                {helperText ? (
                  <p
                    className={
                      usesDuosFeedTone
                        ? "oc-profile-meta text-[11px] leading-5"
                        : "text-sm leading-6 text-zinc-500"
                    }
                  >
                    {helperText}
                  </p>
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
                  ) : type === "stacks" && isBlockedFromStackCreate ? (
                    resolvedActiveStackPostId && profile?.id ? (
                      <Suspense fallback={<CurrentStackPanelFallback />}>
                        <DeferredCurrentStackPanel
                          activeStackPostId={resolvedActiveStackPostId}
                          currentProfileId={profile.id}
                          showBlockedCreateCopy
                        />
                      </Suspense>
                    ) : (
                      <CurrentStackFallbackPanel blockingPostId={resolvedActiveStackPostId} />
                    )
                  ) : (
                    <form
                      action={createLFGPost}
                      className={`px-4 py-4 sm:px-5 sm:py-4.5 ${
                        usesDuosFeedTone
                          ? "rounded-[10px] border border-white/[0.04] bg-white/[0.015]"
                          : "oc-surface-panel rounded-[24px]"
                      }`}
                    >
                      <input type="hidden" name="lfg_type" value={type} />
                      <PostTitleField
                        placeholder={
                          isStacksPage
                            ? "Building a chill ranked stack for tonight..."
                            : undefined
                        }
                        tone={usesDuosFeedTone ? "duos" : "default"}
                      />
                      <LFGGameModePicker tone={usesDuosFeedTone ? "duos" : "default"} />
                      <LFGRolePicker
                        profileSummary={profileSummary}
                        roleOptions={composerRoleOptions}
                        setupHref="/account/competitive"
                        showLookingFor={!isStacksPage}
                        tone={usesDuosFeedTone ? "duos" : "default"}
                      />
                    </form>
                  )}
                </PageReveal>
              ) : null}
            </header>

            {shouldShowFeed ? (
              <>
                <div
                  className={
                    usesDuosFeedTone
                      ? "flex min-h-0 flex-1 flex-col border-t border-white/[0.03] bg-[linear-gradient(180deg,rgba(255,255,255,0.012)_0%,rgba(255,255,255,0.006)_100%)]"
                      : "flex min-h-0 flex-1 flex-col"
                  }
                >
                {shouldShowCurrentStackPanel && profile?.id && resolvedActiveStackPostId ? (
                  <Suspense fallback={<CurrentStackPanelFallback />}>
                    <DeferredCurrentStackPanel
                      activeStackPostId={resolvedActiveStackPostId}
                      currentProfileId={profile.id}
                      showBlockedCreateCopy={showBlockedCurrentStackCopy}
                    />
                  </Suspense>
                ) : shouldShowCurrentStackFallback ? (
                  <CurrentStackFallbackPanel blockingPostId={resolvedActiveStackPostId} />
                ) : null}
                {useSidebarLayout ? (
                  <div className="lg:hidden">
                    <Suspense fallback={<div className="h-14" />}>
                      <LFGFeedFiltersPanel
                        activeCount={visiblePostCount}
                        selectedFilters={feedFilters}
                        tone={usesDuosFeedTone ? "duos" : "default"}
                      />
                    </Suspense>
                  </div>
                ) : type === "duos" || type === "stacks" ? (
                  <Suspense fallback={<div className="h-14" />}>
                    <LFGFeedFiltersPanel
                      activeCount={visiblePostCount}
                      selectedFilters={feedFilters}
                      tone={usesDuosFeedTone ? "duos" : "default"}
                    />
                  </Suspense>
                ) : (
                  <LFGFiltersBar description={filtersDescription} />
                )}
                {type === "duos" ? (
                  <DuosInfiniteFeed
                    key={`duos-${useFixtures ? "fixtures" : "live"}-${JSON.stringify(
                      feedFilters ?? {}
                    )}`}
                    currentProfileId={profile?.id ?? null}
                    emptyStateDescription={emptyStateDescription}
                    emptyStateTitle={emptyStateTitle}
                    errorMessage={pageData.postsErrorMessage}
                    feedFilters={feedFilters}
                    hasActiveFilters={hasActiveLFGFeedFilters(feedFilters)}
                    initialHasMore={pageData.hasMorePosts}
                    initialInviteStates={inviteStates}
                    initialNextCursor={pageData.nextCursor}
                    initialPosts={pageData.posts}
                    retryHref={sectionHref}
                    tone={usesDuosFeedTone ? "duos" : "default"}
                    useFixtures={useFixtures}
                    viewerState={!user ? "guest" : profile ? "signed_in" : "profile_required"}
                  />
                ) : (
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
                    layout={type === "stacks" ? "grid-3" : "list"}
                    posts={pageData.posts}
                    retryHref={sectionHref}
                    stackRequestStates={stackRequestStates}
                    tone={usesDuosFeedTone ? "duos" : "default"}
                    type={type}
                    viewerState={!user ? "guest" : profile ? "signed_in" : "profile_required"}
                  />
                )}
                </div>
              </>
            ) : null}
          </div>
        </section>
      </PageContainer>
    </main>
  );
}
