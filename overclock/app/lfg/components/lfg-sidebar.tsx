"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  ChevronDownIcon,
  ChevronUpIcon,
  LayoutGridIcon,
  PlusIcon,
  RotateCcwIcon,
  ShieldIcon,
  TrophyIcon,
  Users2Icon,
  UsersIcon,
} from "lucide-react";
import { useState } from "react";

import { COMPETITIVE_ROLE_LABELS } from "@/lib/competitive/competitive-role-labels";
import { COMPETITIVE_ROLE_OPTIONS } from "@/lib/competitive/competitive-profile-types";
import {
  LFG_RANK_FILTER_OPTIONS,
  LFG_REGION_OPTIONS,
  type LFGFeedFilters,
} from "@/lib/lfg/lfg-feed-filters";
import {
  getLFGGameModeLabel,
  LFG_GAME_MODE_OPTIONS,
  type LFGType,
} from "@/lib/lfg/lfg-post-types";

type FilterKey =
  | "looking_for"
  | "max_rank"
  | "min_rank"
  | "mode"
  | "region"
  | "role"
  | "search";

function buildFilterHref(
  pathname: string,
  searchParams: URLSearchParams,
  key: FilterKey,
  value?: string
) {
  const params = new URLSearchParams(searchParams.toString());

  if (value) {
    params.set(key, value);
  } else {
    params.delete(key);
  }

  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}

function buildRankFilterHref(
  pathname: string,
  searchParams: URLSearchParams,
  rank: string | null
) {
  const params = new URLSearchParams(searchParams.toString());

  if (rank) {
    params.set("min_rank", rank);
    params.set("max_rank", rank);
  } else {
    params.delete("min_rank");
    params.delete("max_rank");
  }

  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}

function buildClearFiltersHref(pathname: string, searchParams: URLSearchParams) {
  const params = new URLSearchParams(searchParams.toString());

  params.delete("mode");
  params.delete("role");
  params.delete("looking_for");
  params.delete("min_rank");
  params.delete("max_rank");
  params.delete("region");
  params.delete("search");

  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}

const LFG_NAV_ITEMS = [
  { href: "/lfg", label: "Overview", Icon: LayoutGridIcon, soon: false },
  { href: "/duos", label: "Duos", Icon: UsersIcon, soon: false },
  { href: "/stacks", label: "Stacks", Icon: Users2Icon, soon: false },
  { href: "/scrims", label: "Scrims", Icon: ShieldIcon, soon: true },
  { href: "/teams", label: "Teams", Icon: TrophyIcon, soon: true },
] as const;

function FilterSection({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex w-full items-center justify-between py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500 transition hover:text-zinc-400"
      >
        {title}
        {isOpen ? (
          <ChevronUpIcon className="h-3 w-3 shrink-0" />
        ) : (
          <ChevronDownIcon className="h-3 w-3 shrink-0" />
        )}
      </button>
      {isOpen ? <div className="mt-0.5 space-y-0.5">{children}</div> : null}
    </div>
  );
}

function FilterItem({
  href,
  isSelected,
  label,
}: {
  href: string;
  isSelected: boolean;
  label: string;
}) {
  return (
    <Link
      href={href}
      className={`flex h-7 items-center gap-2 rounded-lg px-2 text-[12px] transition ${
        isSelected
          ? "bg-white/6 font-medium text-zinc-100"
          : "font-normal text-zinc-400 hover:bg-white/4 hover:text-zinc-200"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 shrink-0 rounded-full transition ${
          isSelected ? "bg-sky-400" : "bg-transparent"
        }`}
      />
      {label}
    </Link>
  );
}

type LFGSidebarProps = {
  createPostHref: string;
  isLoggedIn: boolean;
  selectedFilters?: LFGFeedFilters;
  type: LFGType;
};

export function LFGSidebar({
  createPostHref,
  isLoggedIn,
  selectedFilters,
  type,
}: LFGSidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const params = new URLSearchParams(searchParams.toString());

  const hasActiveFilters = Boolean(
    selectedFilters?.lookingFor ||
      selectedFilters?.maxRank ||
      selectedFilters?.minRank ||
      selectedFilters?.mode ||
      selectedFilters?.role ||
      selectedFilters?.region ||
      selectedFilters?.search
  );

  const resolvedCreateHref = isLoggedIn
    ? createPostHref
    : `/login?next=/${type}/create`;

  // Single rank selection — sets both min and max to same tier for simple filtering
  const selectedRank =
    selectedFilters?.minRank &&
    selectedFilters.minRank === selectedFilters?.maxRank
      ? selectedFilters.minRank
      : undefined;

  return (
    <aside className="hidden w-52 shrink-0 flex-col gap-5 self-start rounded-[28px] border border-white/[0.07] bg-[#05070b] px-5 py-5 shadow-[0_24px_70px_rgba(0,0,0,0.24),inset_0_1px_0_rgba(255,255,255,0.04)] sm:py-7 lg:flex">
      {/* LFG navigation */}
      <nav>
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-600">
          LFG
        </p>
        <ul className="space-y-0.5">
          {LFG_NAV_ITEMS.map(({ href, label, Icon, soon }) => {
            const isActive = pathname === href;
            return (
              <li key={href}>
                {soon ? (
                  <div className="flex h-8 items-center gap-2.5 rounded-lg px-2 text-[12px] text-zinc-700 cursor-default select-none">
                    <Icon className="h-3.5 w-3.5 shrink-0" />
                    <span>{label}</span>
                    <span className="ml-auto text-[9px] font-semibold uppercase tracking-[0.14em] text-zinc-700">
                      Soon
                    </span>
                  </div>
                ) : (
                  <Link
                    href={href}
                    className={`flex h-8 items-center gap-2.5 rounded-lg px-2 text-[12px] transition ${
                      isActive
                        ? "bg-white/6 font-semibold text-zinc-50"
                        : "font-medium text-zinc-400 hover:bg-white/4 hover:text-zinc-200"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0" />
                    {label}
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Create post CTA */}
      <Link
        href={resolvedCreateHref}
        className="inline-flex h-8 items-center justify-center gap-1.5 rounded-full bg-violet-600/80 px-3.5 text-[12px] font-semibold text-white transition hover:bg-violet-500/80"
      >
        <PlusIcon className="h-3.5 w-3.5" />
        Create Post
      </Link>

      {/* Filters */}
      <div className="space-y-4">
        <FilterSection title="Mode">
          {LFG_GAME_MODE_OPTIONS.map((mode) => (
            <FilterItem
              key={mode}
              href={
                selectedFilters?.mode === mode
                  ? buildFilterHref(pathname, params, "mode")
                  : buildFilterHref(pathname, params, "mode", mode)
              }
              isSelected={selectedFilters?.mode === mode}
              label={getLFGGameModeLabel(mode)}
            />
          ))}
        </FilterSection>

        <FilterSection title="Role">
          {COMPETITIVE_ROLE_OPTIONS.map((role) => (
            <FilterItem
              key={role}
              href={
                selectedFilters?.role === role
                  ? buildFilterHref(pathname, params, "role")
                  : buildFilterHref(pathname, params, "role", role)
              }
              isSelected={selectedFilters?.role === role}
              label={COMPETITIVE_ROLE_LABELS[role]}
            />
          ))}
        </FilterSection>

        <FilterSection title="Needs">
          {COMPETITIVE_ROLE_OPTIONS.map((role) => (
            <FilterItem
              key={role}
              href={
                selectedFilters?.lookingFor === role
                  ? buildFilterHref(pathname, params, "looking_for")
                  : buildFilterHref(pathname, params, "looking_for", role)
              }
              isSelected={selectedFilters?.lookingFor === role}
              label={COMPETITIVE_ROLE_LABELS[role]}
            />
          ))}
        </FilterSection>

        <FilterSection title="Region">
          {LFG_REGION_OPTIONS.map((region) => (
            <FilterItem
              key={region}
              href={
                selectedFilters?.region === region
                  ? buildFilterHref(pathname, params, "region")
                  : buildFilterHref(pathname, params, "region", region)
              }
              isSelected={selectedFilters?.region === region}
              label={region}
            />
          ))}
        </FilterSection>

        <FilterSection title="Rank">
          {LFG_RANK_FILTER_OPTIONS.map((rank) => (
            <FilterItem
              key={rank}
              href={buildRankFilterHref(
                pathname,
                params,
                selectedRank === rank ? null : rank
              )}
              isSelected={selectedRank === rank}
              label={rank}
            />
          ))}
        </FilterSection>

        {hasActiveFilters ? (
          <Link
            href={buildClearFiltersHref(pathname, params)}
            className="flex items-center gap-1.5 text-[11px] font-medium text-zinc-500 transition hover:text-zinc-300"
          >
            <RotateCcwIcon className="h-3 w-3" />
            Clear Filters
          </Link>
        ) : null}
      </div>
    </aside>
  );
}
