"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  ChevronDownIcon,
  ChevronUpIcon,
  LayoutGridIcon,
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

const LFG_NAV_ITEMS = [
  { href: "/lfg", label: "Overview", Icon: LayoutGridIcon },
  { href: "/duos", label: "Duos", Icon: UsersIcon },
  { href: "/stacks", label: "Stacks", Icon: Users2Icon },
] as const;

function FilterSection({
  children,
  tone = "default",
  title,
}: {
  children: React.ReactNode;
  tone?: "default" | "duos";
  title: string;
}) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`flex w-full items-center justify-between py-0.5 transition hover:text-zinc-300 ${
          tone === "duos"
            ? "oc-profile-meta text-[11px] font-medium uppercase tracking-[0.16em] hover:text-zinc-100"
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
      className={`flex h-7 items-center px-2 text-[12px] transition ${
        isSelected
          ? "bg-white/[0.06] font-medium text-zinc-100"
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

  // Single rank selection — both min and max set to the same tier
  const selectedRank =
    selectedFilters?.minRank &&
    selectedFilters.minRank === selectedFilters?.maxRank
      ? selectedFilters.minRank
      : undefined;

  return (
    <aside
      className={`hidden w-56 shrink-0 self-start flex-col gap-3 p-3 lg:flex sticky top-6 sm:top-8 max-h-[calc(100vh-3rem)] sm:max-h-[calc(100vh-4rem)] overflow-y-auto oc-sidebar-scroll ${
        tone === "duos"
          ? "rounded-[10px] border border-white/[0.03] bg-white/[0.01]"
          : "rounded-xl border border-white/6 bg-[#05070b] shadow-[0_24px_70px_rgba(0,0,0,0.22),inset_0_1px_0_rgba(255,255,255,0.03)]"
      }`}
    >
      {/* LFG navigation */}
      <nav>
        <p
          className={`mb-1.5 ${
            tone === "duos"
              ? "oc-profile-meta text-[10px] font-semibold uppercase tracking-[0.16em]"
              : "text-[10px] font-medium text-zinc-600"
          }`}
          style={tone === "duos" ? { color: "rgb(228 228 231 / 0.9)" } : undefined}
        >
          LFG
        </p>
        <ul className="space-y-px">
          {LFG_NAV_ITEMS.map(({ href, label, Icon }) => {
            const isActive = pathname === href;
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={`flex items-center gap-2 px-2.5 text-[12px] transition ${
                    isActive
                      ? tone === "duos"
                        ? "h-8 rounded-[8px] bg-white/[0.06] font-semibold text-zinc-200"
                        : "h-7 rounded-md bg-white/5 font-medium text-zinc-200"
                      : tone === "duos"
                        ? "h-8 rounded-[8px] font-medium text-zinc-500 hover:bg-white/[0.03] hover:text-zinc-300"
                        : "h-7 rounded-md font-normal text-zinc-500 hover:bg-white/3 hover:text-zinc-300"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className={tone === "duos" ? "border-t border-white/[0.03]" : "border-t border-white/5"} />

      {/* Filters */}
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
    </aside>
  );
}
