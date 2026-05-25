import { COMPETITIVE_ROLE_LABELS } from "@/lib/competitive/competitive-role-labels";
import type { LFGFeedFilters } from "@/lib/lfg/lfg-feed-filters";
import { getLFGGameModeLabel } from "@/lib/lfg/lfg-post-types";

export type FilterKey =
  | "looking_for"
  | "max_rank"
  | "min_rank"
  | "mode"
  | "region"
  | "search"
  | "role";

export type ActiveLFGFilterChip = {
  href: string;
  key: FilterKey;
  label: string;
  value: string;
};

export function buildFilterHref(
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

export function buildClearFiltersHref(pathname: string, searchParams: URLSearchParams) {
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

export function buildClearFilterHref(
  pathname: string,
  searchParams: URLSearchParams,
  key: FilterKey
) {
  const params = new URLSearchParams(searchParams.toString());

  params.delete(key);

  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}

export function buildFeedFilterSearchParams(
  filters?: LFGFeedFilters,
  useFixtures = false
) {
  const params = new URLSearchParams();

  if (filters?.mode) {
    params.set("mode", filters.mode);
  }

  if (filters?.role) {
    params.set("role", filters.role);
  }

  if (filters?.lookingFor) {
    params.set("looking_for", filters.lookingFor);
  }

  if (filters?.minRank) {
    params.set("min_rank", filters.minRank);
  }

  if (filters?.maxRank) {
    params.set("max_rank", filters.maxRank);
  }

  if (filters?.region) {
    params.set("region", filters.region);
  }

  if (filters?.search) {
    params.set("search", filters.search);
  }

  if (useFixtures) {
    params.set("fixtures", "1");
  }

  return params;
}

export function getActiveLFGFilterChips(
  pathname: string,
  searchParams: URLSearchParams,
  selectedFilters?: LFGFeedFilters
): ActiveLFGFilterChip[] {
  return [
    selectedFilters?.region
      ? {
          href: buildClearFilterHref(pathname, searchParams, "region"),
          key: "region" as const,
          label: "Region",
          value: selectedFilters.region,
        }
      : null,
    selectedFilters?.mode
      ? {
          href: buildClearFilterHref(pathname, searchParams, "mode"),
          key: "mode" as const,
          label: "Mode",
          value: getLFGGameModeLabel(selectedFilters.mode),
        }
      : null,
    selectedFilters?.role
      ? {
          href: buildClearFilterHref(pathname, searchParams, "role"),
          key: "role" as const,
          label: "Role",
          value: COMPETITIVE_ROLE_LABELS[selectedFilters.role],
        }
      : null,
    selectedFilters?.lookingFor
      ? {
          href: buildClearFilterHref(pathname, searchParams, "looking_for"),
          key: "looking_for" as const,
          label: "Needs",
          value: COMPETITIVE_ROLE_LABELS[selectedFilters.lookingFor],
        }
      : null,
    selectedFilters?.minRank
      ? {
          href: buildClearFilterHref(pathname, searchParams, "min_rank"),
          key: "min_rank" as const,
          label: "Min Rank",
          value: selectedFilters.minRank,
        }
      : null,
    selectedFilters?.maxRank
      ? {
          href: buildClearFilterHref(pathname, searchParams, "max_rank"),
          key: "max_rank" as const,
          label: "Max Rank",
          value: selectedFilters.maxRank,
        }
      : null,
    selectedFilters?.search
      ? {
          href: buildClearFilterHref(pathname, searchParams, "search"),
          key: "search" as const,
          label: "Search",
          value: selectedFilters.search,
        }
      : null,
  ].filter((chip): chip is ActiveLFGFilterChip => Boolean(chip));
}
