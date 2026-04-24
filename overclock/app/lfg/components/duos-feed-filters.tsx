"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ChevronDownIcon, FilterIcon, XIcon } from "lucide-react";

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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type FilterKey = "role" | "rank" | "region";

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
          className="inline-flex h-10 items-center gap-2 rounded-full border border-white/10 bg-white/[0.025] px-4 text-sm font-semibold text-zinc-200 transition hover:border-white/20 hover:bg-white/[0.045] hover:text-zinc-50"
        >
          <span className="text-zinc-500">{label}:</span>
          <span>{selectedLabel}</span>
          <ChevronDownIcon className="h-4 w-4 text-zinc-500" />
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

export function DuosFeedFilters({
  description,
  selectedFilters,
}: {
  description: string;
  selectedFilters?: LFGFeedFilters;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const params = new URLSearchParams(searchParams.toString());
  const hasActiveFilters = Boolean(
    selectedFilters?.role || selectedFilters?.rank || selectedFilters?.region
  );

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
    <section className="border-t border-white/10 px-5 py-5 sm:px-6">
      <div className="rounded-[18px] border border-white/10 bg-white/[0.02] px-4 py-4">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/[0.035] text-zinc-400">
                <FilterIcon className="h-4 w-4" />
              </span>
              <div>
                <h2 className="text-sm font-semibold text-zinc-100">Filter Duos</h2>
                <p className="mt-0.5 text-sm text-zinc-500">{description}</p>
              </div>
            </div>
            {hasActiveFilters ? (
              <Link
                href={pathname}
                className="inline-flex h-9 items-center gap-2 rounded-full border border-white/10 bg-white/[0.025] px-3 text-xs font-semibold text-zinc-300 transition hover:border-white/20 hover:bg-white/[0.045] hover:text-zinc-50"
              >
                <XIcon className="h-3.5 w-3.5" />
                Clear Filters
              </Link>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-3">
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
        </div>
      </div>
    </section>
  );
}
