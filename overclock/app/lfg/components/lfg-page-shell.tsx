import { FilterIcon, SearchIcon } from "lucide-react";

import { PageContainer } from "@/app/components/page-container";
import { getCompetitiveProfile } from "@/lib/competitive/competitive-profile";
import { COMPETITIVE_ROLE_OPTIONS } from "@/lib/competitive/competitive-profile-types";
import { getProfileHeroPools } from "@/lib/heroes/profile-hero-pools";
import { HERO_ROSTER } from "@/lib/heroes/hero-roster";
import { getCurrentProfile } from "@/lib/profiles/get-current-profile";
import { formatCurrentRank } from "@/lib/profiles/profile-editor";

import { LFGRolePicker } from "./lfg-role-picker";
import { PostTitleField } from "./post-title-field";

type LFGPageShellProps = {
  description: string;
  emptyStateDescription?: string;
  emptyStateTitle?: string;
  filtersDescription?: string;
  helperText?: string;
  title: string;
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
            <p className="mt-0.5 text-sm text-zinc-500">
              {description}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function LFGFeedPlaceholder({
  description,
  title,
}: {
  description: string;
  title: string;
}) {
  return (
    <section className="border-t border-white/10 px-5 py-5 sm:px-6 sm:py-6">
      <div className="grid min-h-[280px] place-items-center rounded-[20px] border border-dashed border-white/12 bg-white/[0.02] px-5 py-10 text-center">
        <div className="max-w-sm">
          <span className="mx-auto grid h-11 w-11 place-items-center rounded-full border border-white/10 bg-white/[0.035] text-zinc-400">
            <SearchIcon className="h-5 w-5" />
          </span>
          <h2 className="mt-4 text-base font-semibold text-zinc-100">
            {title}
          </h2>
          <p className="mt-2 text-sm leading-6 text-zinc-500">
            {description}
          </p>
        </div>
      </div>
    </section>
  );
}

export async function LFGPageShell({
  description,
  emptyStateDescription = "Create a post to start the conversation.",
  emptyStateTitle = "No posts yet",
  filtersDescription = "Filter by rank, role, region, and playstyle.",
  helperText,
  title,
}: LFGPageShellProps) {
  const { profile } = await getCurrentProfile();
  const [competitiveProfile, heroPools] = profile
    ? await Promise.all([
        getCompetitiveProfile(profile.id),
        getProfileHeroPools(profile.id),
      ])
    : [null, null];

  const roleOptions = competitiveProfile && heroPools
    ? COMPETITIVE_ROLE_OPTIONS.map((role) => {
        const roleProfile =
          competitiveProfile.roles.find((candidate) => candidate.role === role) ??
          null;
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
      })
    : [];

  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-5 text-zinc-100 sm:px-6 sm:py-7">
      <PageContainer className="flex flex-col gap-4">
        <section className="rounded-[28px] border border-white/10 bg-white/[0.025] p-px shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
          <div className="overflow-hidden rounded-[27px] bg-zinc-950">
            <header className="px-5 py-5 sm:px-6 sm:py-6">
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
              <section className="mt-6 rounded-[24px] border border-sky-300/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] p-5 shadow-[0_16px_40px_rgba(0,0,0,0.18),inset_0_1px_0_rgba(255,255,255,0.06)]">
                <h2 className="text-lg font-semibold tracking-[-0.03em] text-zinc-50">
                  Create a Post
                </h2>
                <p className="mt-1.5 text-sm leading-6 text-zinc-400">
                  Create a post to find your next duo.
                </p>
                <PostTitleField />
                {profile ? (
                  <LFGRolePicker
                    profileSummary={{
                      region: profile.region ?? "Not set",
                      timezone: profile.timezone ?? "Not set",
                    }}
                    roleOptions={roleOptions}
                    setupHref="/account/competitive"
                  />
                ) : null}
              </section>

            </header>

            <LFGFiltersBar description={filtersDescription} />
            <LFGFeedPlaceholder
              description={emptyStateDescription}
              title={emptyStateTitle}
            />
          </div>
        </section>
      </PageContainer>
    </main>
  );
}
