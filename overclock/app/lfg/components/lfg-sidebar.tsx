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
        className="flex w-full items-center justify-between py-0.5 text-[11px] font-medium text-zinc-500 transition hover:text-zinc-400"
      >
        {title}
        {isOpen ? (
          <ChevronUpIcon className="h-2.5 w-2.5 shrink-0 text-zinc-600" />
        ) : (
          <ChevronDownIcon className="h-2.5 w-2.5 shrink-0 text-zinc-600" />
        )}
      </button>
      {isOpen ? <div className="mt-1 space-y-px">{children}</div> : null}
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
      className={`flex h-6 items-center rounded-md px-2 text-[12px] transition ${
        isSelected
          ? "bg-white/5 font-medium text-zinc-100"
          : "text-zinc-500 hover:bg-white/3 hover:text-zinc-300"
      }`}
    >
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

  // Single rank selection — both min and max set to the same tier
  const selectedRank =
    selectedFilters?.minRank &&
    selectedFilters.minRank === selectedFilters?.maxRank
      ? selectedFilters.minRank
      : undefined;

  return (
    <aside className="hidden w-56 shrink-0 flex-col gap-4 self-start rounded-xl border border-white/6 bg-[#05070b] p-4 shadow-[0_24px_70px_rgba(0,0,0,0.22),inset_0_1px_0_rgba(255,255,255,0.03)] lg:flex">
      {/* LFG navigation */}
      <nav>
        <p className="mb-1.5 text-[10px] font-medium text-zinc-600">LFG</p>
        <ul className="space-y-px">
          {LFG_NAV_ITEMS.map(({ href, label, Icon, soon }) => {
            const isActive = pathname === href;
            return (
              <li key={href}>
                {soon ? (
                  <div className="flex h-7 cursor-default select-none items-center gap-2 px-2 text-[12px] text-zinc-700">
                    <Icon className="h-3.5 w-3.5 shrink-0" />
                    <span>{label}</span>
                    <span className="ml-auto text-[9px] font-medium tracking-wide text-zinc-700">
                      soon
                    </span>
                  </div>
                ) : (
                  <Link
                    href={href}
                    className={`flex h-7 items-center gap-2 rounded-md px-2 text-[12px] transition ${
                      isActive
                        ? "bg-white/5 font-medium text-zinc-200"
                        : "font-normal text-zinc-500 hover:bg-white/3 hover:text-zinc-300"
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

      <div className="border-t border-white/5" />

      {/* Create post */}
      <Link
        href={resolvedCreateHref}
        className="flex h-7 items-center gap-1.5 rounded-md border border-white/8 bg-white/2 px-2.5 text-[12px] font-medium text-zinc-400 transition hover:border-white/11 hover:text-zinc-200"
      >
        <PlusIcon className="h-3 w-3 shrink-0" />
        Create Post
      </Link>

      <div className="border-t border-white/5" />

      {/* Filters */}
      <div className="space-y-3">
        <FilterSection title="/ mode">
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

        <FilterSection title="/ role">
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

        <FilterSection title="/ needs">
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

        <FilterSection title="/ region">
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

        <FilterSection title="/ rank">
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
            className="flex items-center gap-1 pt-0.5 text-[11px] font-normal text-zinc-600 transition hover:text-zinc-400"
          >
            <RotateCcwIcon className="h-2.5 w-2.5 shrink-0" />
            clear filters
          </Link>
        ) : null}
      </div>
    </aside>
  );
}
