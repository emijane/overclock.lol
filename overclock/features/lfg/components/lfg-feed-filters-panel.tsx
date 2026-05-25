"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  CheckIcon,
  ChevronDownIcon,
  FilterIcon,
  XIcon,
} from "lucide-react";
import { useEffect, useState } from "react";

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
import {
  buildClearFiltersHref,
  buildFilterHref,
  getActiveLFGFilterChips,
  type FilterKey,
} from "./lfg-active-filter-links";

type FilterItem = {
  href: string;
  label: string;
  selected: boolean;
};

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
  items: FilterItem[];
  pathname: string;
  paramKey: FilterKey;
  searchParams: URLSearchParams;
  selectedLabel: string;
  tone?: "default" | "duos";
  variant?: "default" | "primary" | "secondary";
}) {
  const borderClassName =
    tone === "duos"
      ? "border-white/[0.06] hover:border-white/[0.12]"
      : "border-white/[0.08] hover:border-white/[0.12]";
  const triggerClassName =
    variant === "primary"
      ? `oc-profile-display inline-flex h-7.5 items-center gap-1 rounded-[10px] border ${borderClassName} px-2.5 text-[12px] font-semibold transition ${
          tone === "duos"
            ? "bg-white/[0.03] text-zinc-50 hover:bg-white/[0.06] hover:text-white"
            : "bg-[#05070b] text-zinc-50 hover:text-white"
        }`
      : variant === "secondary"
        ? `oc-profile-display inline-flex h-7.5 items-center gap-1 rounded-[10px] border ${borderClassName} px-2.5 text-[12px] font-medium transition ${
            tone === "duos"
              ? "bg-white/[0.03] text-zinc-300 hover:bg-white/[0.06] hover:text-zinc-50"
              : "bg-[#05070b] text-zinc-200 hover:text-zinc-50"
          }`
        : `oc-profile-display inline-flex h-7.5 items-center gap-1 rounded-[10px] border ${borderClassName} px-2.5 text-[12px] font-semibold transition ${
            tone === "duos"
              ? "bg-white/[0.03] text-zinc-100 hover:bg-white/[0.06] hover:text-zinc-50"
              : "bg-[#05070b] text-zinc-100 hover:text-zinc-50"
          }`;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" className={triggerClassName}>
          <span>{selectedLabel}</span>
          <ChevronDownIcon className="h-3 w-3 text-zinc-500" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="w-48 border border-white/[0.08] bg-[#0a0a0b] text-zinc-100"
      >
        <DropdownMenuItem
          asChild
          className="oc-profile-display text-zinc-400 focus:bg-white/[0.04] focus:text-zinc-100"
        >
          <Link href={buildFilterHref(pathname, searchParams, paramKey)}>{anyLabel}</Link>
        </DropdownMenuItem>
        {items.map((item) => (
          <DropdownMenuItem
            key={item.href}
            asChild
            className={
              item.selected
                ? "oc-profile-display text-zinc-50 focus:bg-white/[0.04]"
                : "oc-profile-display text-zinc-400 focus:bg-white/[0.04] focus:text-zinc-100"
            }
          >
            <Link href={item.href}>{item.label}</Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function MobileFilterSection({
  anyHref,
  anyLabel,
  anySelected,
  items,
  title,
}: {
  anyHref: string;
  anyLabel: string;
  anySelected: boolean;
  items: FilterItem[];
  title: string;
}) {
  return (
    <section className="space-y-1.5">
      <p className="oc-profile-meta text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-400">
        {title}
      </p>
      <div className="space-y-1.5">
        <Link
          href={anyHref}
          className={`oc-profile-display flex min-h-10 items-center justify-between rounded-[12px] border px-3 text-[13px] transition ${
            anySelected
              ? "border-white/[0.12] bg-white/[0.06] text-zinc-50"
              : "border-white/[0.06] bg-white/[0.025] text-zinc-300 hover:border-white/[0.12] hover:bg-white/[0.05] hover:text-zinc-50"
          }`}
        >
          <span>{anyLabel}</span>
          {anySelected ? <CheckIcon className="h-3.5 w-3.5 text-zinc-100" /> : null}
        </Link>
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`oc-profile-display flex min-h-10 items-center justify-between rounded-[12px] border px-3 text-[13px] transition ${
              item.selected
                ? "border-white/[0.12] bg-white/[0.06] text-zinc-50"
                : "border-white/[0.06] bg-white/[0.025] text-zinc-300 hover:border-white/[0.12] hover:bg-white/[0.05] hover:text-zinc-50"
            }`}
          >
            <span>{item.label}</span>
            {item.selected ? <CheckIcon className="h-3.5 w-3.5 text-zinc-100" /> : null}
          </Link>
        ))}
      </div>
    </section>
  );
}

export function LFGFeedFiltersPanel({
  activeCount,
  activeFilterDisplay = "row",
  mobileMode = "inline",
  selectedFilters,
  tone = "default",
}: {
  activeCount: number;
  activeFilterDisplay?: "row" | "toolbar";
  mobileMode?: "inline" | "sheet";
  selectedFilters?: LFGFeedFilters;
  tone?: "default" | "duos";
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const params = new URLSearchParams(searchParams.toString());
  const [isMobileSheetOpen, setIsMobileSheetOpen] = useState(false);

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

  useEffect(() => {
    if (!isMobileSheetOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsMobileSheetOpen(false);
      }
    }

    function handleResize() {
      if (window.innerWidth >= 640) {
        setIsMobileSheetOpen(false);
      }
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleEscape);
    window.addEventListener("resize", handleResize);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleEscape);
      window.removeEventListener("resize", handleResize);
    };
  }, [isMobileSheetOpen]);

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
  const activeFilterChips = getActiveLFGFilterChips(pathname, params, selectedFilters);
  const clearFiltersHref = buildClearFiltersHref(pathname, params);
  const mobileActiveFiltersLabel = `${activeFilterChips.length} active`;
  const desktopToolbarClassName =
    mobileMode === "sheet"
      ? "hidden flex-col gap-3 sm:flex sm:flex-row sm:items-center sm:justify-between"
      : "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between";

  return (
    <section className="px-5 py-1.5 sm:px-6 sm:py-2">
      {mobileMode === "sheet" ? (
        <div className="space-y-2.5 sm:hidden">
          <button
            type="button"
            onClick={() => setIsMobileSheetOpen(true)}
            className={`flex w-full items-center justify-between rounded-[12px] border px-3 py-2.5 text-left transition ${
              tone === "duos"
                ? "border-white/[0.06] bg-white/[0.025] hover:border-white/[0.12] hover:bg-white/[0.04]"
                : "border-white/[0.08] bg-[#05070b] hover:border-white/[0.12]"
            }`}
            aria-expanded={isMobileSheetOpen}
            aria-haspopup="dialog"
          >
            <span className="flex items-center gap-2">
              <span className="grid h-7 w-7 place-items-center rounded-[10px] border border-white/[0.06] bg-white/[0.03] text-zinc-300">
                <FilterIcon className="h-3.5 w-3.5" />
              </span>
              <span>
                <span className="oc-profile-display block text-[13px] font-semibold text-zinc-100">
                  Filters
                </span>
                <span className="oc-profile-meta block text-[10px] uppercase tracking-[0.16em] text-zinc-400">
                  {mobileActiveFiltersLabel}
                </span>
              </span>
            </span>
            <ChevronDownIcon className="h-4 w-4 text-zinc-500" />
          </button>

          {activeFilterChips.length > 0 ? (
            <div className="flex flex-wrap items-center gap-1.5">
              {activeFilterChips.map((chip) => (
                <Link
                  key={chip.key}
                  href={chip.href}
                  className="inline-flex h-7 items-center gap-1.5 rounded-[10px] border border-white/[0.06] bg-white/[0.03] px-2.5 text-[11px] transition hover:border-white/[0.12] hover:bg-white/[0.06]"
                >
                  <span className="oc-profile-meta">{chip.label}:</span>
                  <span
                    className={`oc-profile-display font-medium text-zinc-100 ${
                      chip.key === "search" ? "max-w-[11rem] truncate" : ""
                    }`}
                    title={chip.value}
                  >
                    {chip.value}
                  </span>
                  <XIcon className="h-3 w-3 text-zinc-400" />
                </Link>
              ))}
            </div>
          ) : null}

          <p className="oc-profile-meta text-[10px] font-semibold uppercase tracking-[0.18em]">
            {activeCount} active listings
          </p>
        </div>
      ) : null}

      <div className={desktopToolbarClassName}>
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
          <p className="oc-profile-meta text-[10px] font-semibold uppercase tracking-[0.18em]">
            {activeCount} active listings
          </p>
          {activeFilterDisplay === "toolbar" && hasActiveFilters ? (
            <Link
              href={clearFiltersHref}
              className={`oc-profile-meta inline-flex h-7 items-center gap-1 rounded-[10px] border border-dashed px-2.5 text-[11px] font-medium transition hover:text-zinc-100 ${
                tone === "duos"
                  ? "border-white/[0.1] bg-white/[0.02] hover:border-white/[0.16] hover:bg-white/[0.04]"
                  : "border-white/[0.12] bg-[#05070b] hover:border-white/[0.18]"
              }`}
            >
              Clear All
              <XIcon className="h-3 w-3 text-zinc-400" />
            </Link>
          ) : null}
        </div>
      </div>

      {activeFilterDisplay === "row" && activeFilterChips.length > 0 ? (
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {activeFilterChips.map((chip) => (
            <Link
              key={chip.key}
              href={chip.href}
              className={`inline-flex h-7 items-center gap-1.5 rounded-[10px] border px-2.5 transition ${
                tone === "duos"
                  ? "border-white/[0.06] bg-white/[0.03] hover:border-white/[0.12] hover:bg-white/[0.06]"
                  : "border-white/[0.08] bg-[#05070b] hover:border-white/[0.12]"
              }`}
            >
              <span className="oc-profile-meta text-[11px]">{chip.label}:</span>
              <span className="oc-profile-display text-[12px] font-medium text-zinc-100">
                {chip.value}
              </span>
              <XIcon className="h-3 w-3 text-zinc-400" />
            </Link>
          ))}
          {hasActiveFilters ? (
            <Link
              href={clearFiltersHref}
              className={`oc-profile-meta inline-flex h-7 items-center gap-1 rounded-[10px] border border-dashed px-2.5 text-[11px] font-medium transition hover:text-zinc-100 ${
                tone === "duos"
                  ? "border-white/[0.1] bg-white/[0.02] hover:border-white/[0.16] hover:bg-white/[0.04]"
                  : "border-white/[0.12] bg-[#05070b] hover:border-white/[0.18]"
              }`}
            >
              Clear All
              <XIcon className="h-3 w-3 text-zinc-400" />
            </Link>
          ) : null}
        </div>
      ) : null}

      {hasActiveRankFilters ? (
        <p className="oc-profile-meta mt-2 text-[11px] leading-5">
          Rank filters match tier ranges only. Unranked posts are excluded while a
          min or max rank filter is active.
        </p>
      ) : null}

      {mobileMode === "sheet" && isMobileSheetOpen ? (
        <div className="fixed inset-0 z-[90] px-4 sm:hidden">
          <button
            type="button"
            aria-label="Close filters"
            className="absolute inset-0 bg-black/72 backdrop-blur-[2px]"
            onClick={() => setIsMobileSheetOpen(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Duos filters"
            className="absolute inset-x-4 top-1/2 flex max-h-[min(82vh,44rem)] w-auto -translate-y-1/2 flex-col overflow-hidden rounded-[28px] border border-white/[0.08] bg-[#05070b] shadow-[0_24px_70px_rgba(0,0,0,0.24),inset_0_1px_0_rgba(255,255,255,0.04)]"
          >
            <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
              <div>
                <p className="oc-profile-display text-[15px] font-semibold text-zinc-100">
                  Filters
                </p>
                <p className="oc-profile-meta mt-1 text-[10px] uppercase tracking-[0.18em] text-zinc-400">
                  {mobileActiveFiltersLabel}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileSheetOpen(false)}
                className="oc-profile-icon-button inline-flex h-8 w-8 items-center justify-center rounded-[10px] border border-white/[0.06] bg-white/[0.03] text-zinc-300 transition hover:border-white/[0.12] hover:bg-white/[0.06] hover:text-zinc-100"
                aria-label="Close filters"
              >
                <XIcon className="h-4 w-4" />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
              <div className="space-y-4">
                <MobileFilterSection
                  anyHref={buildFilterHref(pathname, params, "mode")}
                  anyLabel="Any mode"
                  anySelected={!selectedFilters?.mode}
                  items={modeItems}
                  title="Mode"
                />
                <MobileFilterSection
                  anyHref={buildFilterHref(pathname, params, "role")}
                  anyLabel="Any role"
                  anySelected={!selectedFilters?.role}
                  items={roleItems}
                  title="Role"
                />
                <MobileFilterSection
                  anyHref={buildFilterHref(pathname, params, "looking_for")}
                  anyLabel="Any role"
                  anySelected={!selectedFilters?.lookingFor}
                  items={lookingForItems}
                  title="Needs"
                />
                <MobileFilterSection
                  anyHref={buildFilterHref(pathname, params, "min_rank")}
                  anyLabel="Any rank"
                  anySelected={!selectedFilters?.minRank}
                  items={minRankItems}
                  title="Min rank"
                />
                <MobileFilterSection
                  anyHref={buildFilterHref(pathname, params, "max_rank")}
                  anyLabel="Any rank"
                  anySelected={!selectedFilters?.maxRank}
                  items={maxRankItems}
                  title="Max rank"
                />
                <MobileFilterSection
                  anyHref={buildFilterHref(pathname, params, "region")}
                  anyLabel="Any region"
                  anySelected={!selectedFilters?.region}
                  items={regionItems}
                  title="Region"
                />
              </div>
            </div>

            {hasActiveFilters ? (
              <div className="border-t border-white/[0.06] px-5 py-3">
                <Link
                  href={clearFiltersHref}
                  className="oc-profile-display inline-flex min-h-10 w-full items-center justify-center rounded-[12px] border border-dashed border-white/[0.12] bg-white/[0.03] px-3 text-[13px] font-medium text-zinc-300 transition hover:border-white/[0.18] hover:bg-white/[0.05] hover:text-zinc-100"
                >
                  Clear filters
                </Link>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}
