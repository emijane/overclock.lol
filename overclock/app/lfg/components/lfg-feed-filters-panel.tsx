"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ChevronDownIcon, XIcon } from "lucide-react";

import { COMPETITIVE_ROLE_LABELS } from "@/lib/competitive/competitive-role-labels";
import { COMPETITIVE_ROLE_OPTIONS } from "@/lib/competitive/competitive-profile-types";
import {
  getRankBracketLabel,
  LFG_RANK_BRACKET_OPTIONS,
  LFG_REGION_OPTIONS,
  type LFGFeedFilters,
  type LFGRankBracket,
  type LFGRegion,
} from "@/lib/lfg/lfg-feed-filters";
import {
  getLFGGameModeLabel,
  LFG_GAME_MODE_OPTIONS,
  type LFGGameMode,
} from "@/lib/lfg/lfg-post-types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type FilterKey = "mode" | "role" | "rank" | "region";

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

function FilterDropdown({
  items,
  label,
  pathname,
  paramKey,
  searchParams,
  selectedLabel,
}: {
  items: Array<{ href: string; label: string; selected: boolean }>;
  label: string;
  pathname: string;
  paramKey: FilterKey;
  searchParams: URLSearchParams;
  selectedLabel: string;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="inline-flex h-7.5 items-center gap-1 rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 text-[12px] font-semibold text-zinc-100 shadow-[0_8px_20px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.03)] transition hover:border-white/[0.13] hover:bg-white/[0.05] hover:text-zinc-50"
        >
          <span>{selectedLabel}</span>
          <ChevronDownIcon className="h-3 w-3 text-zinc-500" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="w-48 border border-white/10 bg-zinc-950 text-zinc-100"
      >
        <DropdownMenuItem
          asChild
          className="text-zinc-400 focus:bg-white/[0.04] focus:text-zinc-100"
        >
          <Link href={buildFilterHref(pathname, searchParams, paramKey)}>
            Any {label}
          </Link>
        </DropdownMenuItem>
        {items.map((item) => (
          <DropdownMenuItem
            key={item.href}
            asChild
            className={
              item.selected
                ? "text-zinc-50 focus:bg-white/[0.04]"
                : "text-zinc-400 focus:bg-white/[0.04] focus:text-zinc-100"
            }
          >
            <Link href={item.href}>{item.label}</Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function LFGFeedFiltersPanel({
  activeCount,
  selectedFilters,
}: {
  activeCount: number;
  selectedFilters?: LFGFeedFilters;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const params = new URLSearchParams(searchParams.toString());
  const hasActiveFilters = Boolean(
    selectedFilters?.lookingFor ||
    selectedFilters?.mode ||
      selectedFilters?.role ||
      selectedFilters?.rank ||
      selectedFilters?.region
  );

  const modeItems = LFG_GAME_MODE_OPTIONS.map((mode) => ({
    href: buildFilterHref(pathname, params, "mode", mode),
    label: getLFGGameModeLabel(mode),
    selected: selectedFilters?.mode === mode,
  }));
  const roleItems = COMPETITIVE_ROLE_OPTIONS.map((role) => ({
    href: buildFilterHref(pathname, params, "role", role),
    label: COMPETITIVE_ROLE_LABELS[role],
    selected: selectedFilters?.role === role,
  }));
  const rankItems = LFG_RANK_BRACKET_OPTIONS.map((rank) => ({
    href: buildFilterHref(pathname, params, "rank", rank),
    label: getRankBracketLabel(rank),
    selected: selectedFilters?.rank === rank,
  }));
  const regionItems = LFG_REGION_OPTIONS.map((region) => ({
    href: buildFilterHref(pathname, params, "region", region),
    label: region,
    selected: selectedFilters?.region === region,
  }));

  const selectedModeLabel = selectedFilters?.mode
    ? getLFGGameModeLabel(selectedFilters.mode as LFGGameMode)
    : "Any Mode";
  const selectedRoleLabel = selectedFilters?.role
    ? COMPETITIVE_ROLE_LABELS[selectedFilters.role]
    : "All Roles";
  const selectedRankLabel = selectedFilters?.rank
    ? getRankBracketLabel(selectedFilters.rank as LFGRankBracket)
    : "Any Rank";
  const selectedRegionLabel = selectedFilters?.region
    ? (selectedFilters.region as LFGRegion)
    : "Any Region";

  return (
    <section className="px-5 py-1.5 sm:px-6 sm:py-2">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-1.5">
          <FilterDropdown
            items={modeItems}
            label="Mode"
            pathname={pathname}
            paramKey="mode"
            searchParams={params}
            selectedLabel={selectedModeLabel}
          />
          <FilterDropdown
            items={roleItems}
            label="Role"
            pathname={pathname}
            paramKey="role"
            searchParams={params}
            selectedLabel={selectedRoleLabel}
          />
          <FilterDropdown
            items={rankItems}
            label="Rank"
            pathname={pathname}
            paramKey="rank"
            searchParams={params}
            selectedLabel={selectedRankLabel}
          />
          <FilterDropdown
            items={regionItems}
            label="Region"
            pathname={pathname}
            paramKey="region"
            searchParams={params}
            selectedLabel={selectedRegionLabel}
          />
        </div>
        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
            {activeCount} active listings
          </p>
          {hasActiveFilters ? (
            <Link
              href={pathname}
              className="inline-flex h-7 items-center gap-1 rounded-full bg-white/[0.07] px-2 text-[10px] font-semibold text-zinc-200 transition hover:bg-white/[0.11] hover:text-zinc-50"
            >
              <XIcon className="h-3 w-3" />
              Clear Filters
            </Link>
          ) : null}
        </div>
      </div>
    </section>
  );
}
