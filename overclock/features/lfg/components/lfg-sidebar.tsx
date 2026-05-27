"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ChevronDownIcon, ChevronUpIcon, XIcon } from "lucide-react";
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
} from "@/lib/lfg/lfg-post-types";
import {
  buildFilterHref,
  buildClearFiltersHref,
  getActiveLFGFilterChips,
} from "./lfg-active-filter-links";

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

function FilterSection({
  children,
  tone = "default",
  title,
}: {
  children: React.ReactNode;
  tone?: "default" | "duos";
  title: string;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="space-y-1.5 border-t border-white/[0.03] pt-3 first:border-t-0 first:pt-0">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`flex w-full items-center justify-between px-2.5 py-0.5 transition hover:text-zinc-300 ${
          tone === "duos"
            ? "oc-profile-meta text-[10px] font-medium uppercase tracking-[0.16em] hover:text-zinc-100"
            : "text-[11px] font-medium text-zinc-400"
        }`}
        style={tone === "duos" ? { color: "rgb(212 212 216 / 0.88)" } : undefined}
      >
        {title}
        {isOpen ? (
          <ChevronUpIcon className="h-2.5 w-2.5 shrink-0 text-zinc-400" />
        ) : (
          <ChevronDownIcon className="h-2.5 w-2.5 shrink-0 text-zinc-400" />
        )}
      </button>
      {isOpen ? <div className="space-y-px">{children}</div> : null}
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
      className={`flex h-8 items-center rounded-[10px] px-2.5 font-mono text-[12px] font-medium transition ${
        isSelected
          ? "bg-white/[0.07] text-zinc-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
          : "text-zinc-500 hover:bg-white/[0.03] hover:text-zinc-300"
      }`}
    >
      {label}
    </Link>
  );
}

type LFGSidebarProps = {
  selectedFilters?: LFGFeedFilters;
  tone?: "default" | "duos";
};

export function LFGSidebar({
  selectedFilters,
  tone = "default",
}: LFGSidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const params = new URLSearchParams(searchParams.toString());
  const activeFilterChips = getActiveLFGFilterChips(pathname, params, selectedFilters);
  const clearFiltersHref = buildClearFiltersHref(pathname, params);

  const selectedRank =
    selectedFilters?.minRank &&
    selectedFilters.minRank === selectedFilters?.maxRank
      ? selectedFilters.minRank
      : undefined;

  return (
    <div className="flex min-w-0 flex-col gap-4 px-2 py-1">
      <div className="space-y-2 pb-3">
        <div className="flex items-center justify-between gap-2">
          <p
            className={`${
              tone === "duos"
                ? "oc-profile-meta px-2.5 text-[10px] font-medium uppercase tracking-[0.16em]"
                : "px-2.5 text-[10px] font-medium text-zinc-600"
            }`}
            style={tone === "duos" ? { color: "rgb(228 228 231 / 0.9)" } : undefined}
          >
            / FILTERS
          </p>
          {activeFilterChips.length > 0 ? (
            <Link
              href={clearFiltersHref}
              className="oc-profile-meta px-2.5 text-[10px] uppercase tracking-[0.14em] text-zinc-500 transition hover:text-zinc-200"
            >
              Clear
            </Link>
          ) : null}
        </div>
        <p className="oc-profile-meta px-2.5 text-[10px] uppercase tracking-[0.14em] text-zinc-500">
          {activeFilterChips.length} active
        </p>
        {activeFilterChips.length > 0 ? (
          <div className="flex flex-wrap gap-1.5 px-2.5">
            {activeFilterChips.map((chip) => (
              <Link
                key={chip.key}
                href={chip.href}
                className="inline-flex h-6 items-center gap-1 rounded-[8px] bg-white/[0.03] px-2 font-mono text-[10px] font-medium uppercase tracking-[0.08em] text-zinc-300 transition hover:bg-white/[0.05] hover:text-zinc-100"
                aria-label={`Remove ${chip.label} filter`}
                title={`${chip.label}: ${chip.value}`}
              >
                <span className="text-zinc-500">{chip.label}</span>
                <span className="max-w-[6.5rem] truncate">{chip.value}</span>
                <XIcon className="h-3 w-3 text-zinc-500" />
              </Link>
            ))}
          </div>
        ) : (
          <p className="oc-profile-meta px-2.5 text-[11px] leading-5 text-zinc-500">
            Pick a mode, role, or rank to narrow the feed.
          </p>
        )}
      </div>

      <div className="space-y-3">
        <FilterSection title="/ mode" tone={tone}>
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

        <FilterSection title="/ role" tone={tone}>
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

        <FilterSection title="/ needs" tone={tone}>
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

        <FilterSection title="/ region" tone={tone}>
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

        <FilterSection title="/ rank" tone={tone}>
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
      </div>
    </div>
  );
}
