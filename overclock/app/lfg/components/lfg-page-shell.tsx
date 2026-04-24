import Link from "next/link";
import { FilterIcon } from "lucide-react";

import { PageContainer } from "@/app/components/page-container";
import { createLFGPost } from "@/app/lfg/actions";
import { AuthMessage } from "@/app/login/components";
import { getCompetitiveProfile } from "@/lib/competitive/competitive-profile";
import { COMPETITIVE_ROLE_OPTIONS } from "@/lib/competitive/competitive-profile-types";
import { getProfileHeroPools } from "@/lib/heroes/profile-hero-pools";
import { HERO_ROSTER } from "@/lib/heroes/hero-roster";
import type { LFGType } from "@/lib/lfg/lfg-post-types";
import { getActiveLFGPosts } from "@/lib/lfg/posts";
import { getCurrentProfile } from "@/lib/profiles/get-current-profile";
import { formatCurrentRank } from "@/lib/profiles/profile-editor";

import { LFGPostList } from "./lfg-post-list";
import { LFGRolePicker, type LFGRoleOption } from "./lfg-role-picker";
import { PostTitleField } from "./post-title-field";

type LFGPageShellProps = {
  description: string;
  emptyStateDescription?: string;
  emptyStateTitle?: string;
  filtersDescription?: string;
  helperText?: string;
  message?: string;
  messageType?: string;
  title: string;
  type?: LFGType;
};

type LFGPageData = {
  posts: Awaited<ReturnType<typeof getActiveLFGPosts>>;
  postsErrorMessage: string | null;
  roleOptions: LFGRoleOption[];
};

function LFGFiltersBar({ description }: { description: string }) {
  return (
    <section className="border-t border-white/10 px-5 py-5 sm:px-6">
      <div className="flex min-h-16 flex-col justify-center rounded-[18px] border border-dashed border-white/12 bg-white/[0.02] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/[0.035] text-zinc-400">
            <FilterIcon className="h-4 w-4" />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-zinc-100">Filters</h2>
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
    <div className="mt-4 rounded-[20px] border border-white/10 bg-white/[0.03] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
      <h3 className="text-sm font-semibold text-zinc-100">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-zinc-400">{description}</p>
      <Link
        href={ctaHref}
        className="mt-4 inline-flex h-10 items-center rounded-full border border-white/10 bg-white/[0.025] px-4 text-sm font-semibold text-zinc-200 transition hover:border-white/20 hover:bg-white/[0.045] hover:text-zinc-50"
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
  profileId: string | null
): Promise<LFGPageData> {
  const postsResult = await getActiveLFGPosts(type)
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
  filtersDescription = "Filter by rank, role, region, and playstyle.",
  helperText,
  message,
  messageType,
  title,
  type,
}: LFGPageShellProps) {
  const { profile, user } = await getCurrentProfile();
  const pageData = type
    ? await getLFGPageData(type, profile?.id ?? null)
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

  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-5 text-zinc-100 sm:px-6 sm:py-7">
      <PageContainer className="flex flex-col gap-4">
        <section className="rounded-[28px] border border-white/10 bg-white/[0.025] p-px shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
          <div className="overflow-hidden rounded-[27px] bg-zinc-950">
            <header className="px-5 py-5 sm:px-6 sm:py-6">
              <AuthMessage message={message} type={messageType} />
              <div>
                <h1 className="text-2xl font-semibold tracking-[-0.04em] text-zinc-50 sm:text-3xl">
                  {title}
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
                  {description}
                </p>
                {helperText ? (
                  <p className="mt-1 text-sm leading-6 text-zinc-500">
                    {helperText}
                  </p>
                ) : null}
              </div>

              {type ? (
                <section className="mt-6">
                  <h2 className="text-lg font-semibold tracking-[-0.03em] text-zinc-50">
                    Create a Post
                  </h2>
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
                  ) : (
                    <form action={createLFGPost}>
                      <input type="hidden" name="lfg_type" value={type} />
                      <PostTitleField />
                      <LFGRolePicker
                        profileSummary={profileSummary}
                        roleOptions={pageData.roleOptions}
                        setupHref="/account/competitive"
                      />
                      {!hasConfiguredRole ? (
                        <LFGActionNotice
                          ctaHref="/account/competitive"
                          ctaLabel="Set Up Competitive Profile"
                          description="Add at least one ranked role before creating a post in this section."
                          title="Competitive profile required"
                        />
                      ) : null}
                    </form>
                  )}
                </section>
              ) : null}
            </header>

            {type ? (
              <>
                <LFGFiltersBar description={filtersDescription} />
                <LFGPostList
                  emptyStateDescription={emptyStateDescription}
                  emptyStateTitle={emptyStateTitle}
                  errorMessage={pageData.postsErrorMessage}
                  posts={pageData.posts}
                />
              </>
            ) : null}
          </div>
        </section>
      </PageContainer>
    </main>
  );
}
