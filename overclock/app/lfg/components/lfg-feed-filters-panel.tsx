"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ChevronDownIcon, XIcon } from "lucide-react";

import { COMPETITIVE_ROLE_LABELS } from "@/lib/competitive/competitive-role-labels";
import { COMPETITIVE_ROLE_OPTIONS } from "@/lib/competitive/competitive-profile-types";
import {
  LFG_RANK_FILTER_OPTIONS,
  LFG_REGION_OPTIONS,
  type LFGFeedFilters,
  type LFGRankFilterOption,
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

type FilterKey =
  | "looking_for"
  | "max_rank"
  | "min_rank"
  | "mode"
  | "region"
  | "search"
  | "role";

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

function buildClearFilterHref(
  pathname: string,
  searchParams: URLSearchParams,
  key: FilterKey
) {
  const params = new URLSearchParams(searchParams.toString());

  params.delete(key);

  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}

function FilterDropdown({
  anyLabel,
  items,
  pathname,
  paramKey,
  searchParams,
  selectedLabel,
  tone = "default",
  variant = "default",
}: {
  anyLabel: string;
  items: Array<{ href: string; label: string; selected: boolean }>;
  pathname: string;
  paramKey: FilterKey;
  searchParams: URLSearchParams;
  selectedLabel: string;
  tone?: "default" | "duos";
  variant?: "default" | "primary" | "secondary";
}) {
  const borderClassName =
    tone === "duos"
      ? "border-white/[0.14] hover:border-white/[0.2]"
      : "border-white/[0.08] hover:border-white/[0.12]";
  const triggerClassName =
    variant === "primary"
      ? `inline-flex h-7.5 items-center gap-1 rounded-full border ${borderClassName} bg-[#05070b] px-2.5 text-[12px] font-semibold text-zinc-50 transition hover:text-white`
      : variant === "secondary"
        ? `inline-flex h-7.5 items-center gap-1 rounded-full border ${borderClassName} bg-[#05070b] px-2.5 text-[12px] font-medium text-zinc-200 transition hover:text-zinc-50`
        : `inline-flex h-7.5 items-center gap-1 rounded-full border ${borderClassName} bg-[#05070b] px-2.5 text-[12px] font-semibold text-zinc-100 transition hover:text-zinc-50`;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={triggerClassName}
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
          <Link href={buildFilterHref(pathname, searchParams, paramKey)}>{anyLabel}</Link>
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
  tone = "default",
}: {
  activeCount: number;
  selectedFilters?: LFGFeedFilters;
  tone?: "default" | "duos";
}) {
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
  const hasActiveRankFilters = Boolean(
    selectedFilters?.minRank || selectedFilters?.maxRank
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
  const lookingForItems = COMPETITIVE_ROLE_OPTIONS.map((role) => ({
    href: buildFilterHref(pathname, params, "looking_for", role),
    label: COMPETITIVE_ROLE_LABELS[role],
    selected: selectedFilters?.lookingFor === role,
  }));
  const minRankItems = LFG_RANK_FILTER_OPTIONS.map((rank) => ({
    href: buildFilterHref(pathname, params, "min_rank", rank),
    label: rank,
    selected: selectedFilters?.minRank === rank,
  }));
  const maxRankItems = LFG_RANK_FILTER_OPTIONS.map((rank) => ({
    href: buildFilterHref(pathname, params, "max_rank", rank),
    label: rank,
    selected: selectedFilters?.maxRank === rank,
  }));
  const regionItems = LFG_REGION_OPTIONS.map((region) => ({
    href: buildFilterHref(pathname, params, "region", region),
    label: region,
    selected: selectedFilters?.region === region,
  }));

  const selectedModeLabel = selectedFilters?.mode
    ? getLFGGameModeLabel(selectedFilters.mode as LFGGameMode)
    : "Mode";
  const selectedRoleLabel = selectedFilters?.role
    ? `Role: ${COMPETITIVE_ROLE_LABELS[selectedFilters.role]}`
    : "Role";
  const selectedLookingForLabel = selectedFilters?.lookingFor
    ? `Needs: ${COMPETITIVE_ROLE_LABELS[selectedFilters.lookingFor]}`
    : "Needs";
  const selectedMinRankLabel = selectedFilters?.minRank
    ? `Min rank: ${selectedFilters.minRank as LFGRankFilterOption}`
    : "Min rank";
  const selectedMaxRankLabel = selectedFilters?.maxRank
    ? `Max rank: ${selectedFilters.maxRank as LFGRankFilterOption}`
    : "Max rank";
  const selectedRegionLabel = selectedFilters?.region
    ? (selectedFilters.region as LFGRegion)
    : "Region";
  const activeFilterChips = [
    selectedFilters?.mode
      ? {
          href: buildClearFilterHref(pathname, params, "mode"),
          key: "mode",
          label: "Mode",
          value: getLFGGameModeLabel(selectedFilters.mode),
        }
      : null,
    selectedFilters?.role
      ? {
          href: buildClearFilterHref(pathname, params, "role"),
          key: "role",
          label: "Role",
          value: COMPETITIVE_ROLE_LABELS[selectedFilters.role],
        }
      : null,
    selectedFilters?.lookingFor
      ? {
          href: buildClearFilterHref(pathname, params, "looking_for"),
          key: "looking_for",
          label: "Needs",
          value: COMPETITIVE_ROLE_LABELS[selectedFilters.lookingFor],
        }
      : null,
    selectedFilters?.minRank
      ? {
          href: buildClearFilterHref(pathname, params, "min_rank"),
          key: "min_rank",
          label: "Min Rank",
          value: selectedFilters.minRank,
        }
      : null,
    selectedFilters?.maxRank
      ? {
          href: buildClearFilterHref(pathname, params, "max_rank"),
          key: "max_rank",
          label: "Max Rank",
          value: selectedFilters.maxRank,
        }
      : null,
    selectedFilters?.region
      ? {
          href: buildClearFilterHref(pathname, params, "region"),
          key: "region",
          label: "Region",
          value: selectedFilters.region,
        }
      : null,
    selectedFilters?.search
      ? {
          href: buildClearFilterHref(pathname, params, "search"),
          key: "search",
          label: "Search",
          value: selectedFilters.search,
        }
      : null,
  ].filter((chip): chip is { href: string; key: string; label: string; value: string } =>
    Boolean(chip)
  );

  return (
    <section className="px-5 py-1.5 sm:px-6 sm:py-2">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-1.5">
          <FilterDropdown
            anyLabel="Any mode"
            items={modeItems}
            pathname={pathname}
            paramKey="mode"
            searchParams={params}
            selectedLabel={selectedModeLabel}
            tone={tone}
          />
          <FilterDropdown
            anyLabel="Any role"
            items={roleItems}
            pathname={pathname}
            paramKey="role"
            searchParams={params}
            selectedLabel={selectedRoleLabel}
            tone={tone}
            variant="primary"
          />
          <FilterDropdown
            anyLabel="Any role"
            items={lookingForItems}
            pathname={pathname}
            paramKey="looking_for"
            searchParams={params}
            selectedLabel={selectedLookingForLabel}
            tone={tone}
            variant="secondary"
          />
          <FilterDropdown
            anyLabel="Any rank"
            items={minRankItems}
            pathname={pathname}
            paramKey="min_rank"
            searchParams={params}
            selectedLabel={selectedMinRankLabel}
            tone={tone}
          />
          <FilterDropdown
            anyLabel="Any rank"
            items={maxRankItems}
            pathname={pathname}
            paramKey="max_rank"
            searchParams={params}
            selectedLabel={selectedMaxRankLabel}
            tone={tone}
          />
          <FilterDropdown
            anyLabel="Any region"
            items={regionItems}
            pathname={pathname}
            paramKey="region"
            searchParams={params}
            selectedLabel={selectedRegionLabel}
            tone={tone}
          />
        </div>
        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
            {activeCount} active listings
          </p>
        </div>
      </div>
      {activeFilterChips.length > 0 ? (
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {activeFilterChips.map((chip) => (
            <Link
              key={chip.key}
              href={chip.href}
              className={`inline-flex h-7 items-center gap-1.5 rounded-full border bg-[#05070b] px-2.5 text-[11px] font-medium text-zinc-200 transition hover:text-zinc-50 ${
                tone === "duos"
                  ? "border-white/[0.14] hover:border-white/[0.2]"
                  : "border-white/[0.08] hover:border-white/[0.12]"
              }`}
            >
              <span className="text-zinc-400">{chip.label}:</span>
              <span className="text-zinc-100">{chip.value}</span>
              <XIcon className="h-3 w-3 text-zinc-400" />
            </Link>
          ))}
          {hasActiveFilters ? (
            <Link
              href={buildClearFiltersHref(pathname, params)}
              className={`inline-flex h-7 items-center gap-1 rounded-full border border-dashed bg-[#05070b] px-2.5 text-[11px] font-medium text-zinc-400 transition hover:text-zinc-100 ${
                tone === "duos"
                  ? "border-white/[0.18] hover:border-white/[0.26]"
                  : "border-white/[0.12] hover:border-white/[0.18]"
              }`}
            >
              Clear All
              <XIcon className="h-3 w-3 text-zinc-400" />
            </Link>
          ) : null}
        </div>
      ) : null}
      {hasActiveRankFilters ? (
        <p className="mt-2 text-[11px] leading-5 text-zinc-500">
          Rank filters match tier ranges only. Unranked posts are excluded while a
          min or max rank filter is active.
        </p>
      ) : null}
    </section>
  );
}
