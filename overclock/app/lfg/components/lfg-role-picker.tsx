"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import {
  ArrowRightIcon,
  ChevronRightIcon,
  MapPinnedIcon,
  PlusIcon,
  ShieldIcon,
  SparklesIcon,
  SwordsIcon,
} from "lucide-react";

import { COMPETITIVE_ROLE_LABELS } from "@/lib/competitive/competitive-role-labels";
import type { CompetitiveRole } from "@/lib/competitive/competitive-profile-types";
import { getRankIconSrc } from "@/lib/competitive/rank-icons";

export type LFGRoleOption = {
  heroPool: Array<{
    id: string;
    imageSrc: string;
    label: string;
  }>;
  isConfigured: boolean;
  rankLabel: string;
  rankTier: string | null;
  role: CompetitiveRole;
};

type LFGRolePickerProps = {
  profileSummary: {
    region: string;
    timezone: string;
  };
  roleOptions: LFGRoleOption[];
  setupHref: string;
};

function getRoleIcon(role: CompetitiveRole, className: string) {
  if (role === "tank") {
    return <ShieldIcon className={className} />;
  }

  if (role === "dps") {
    return <SwordsIcon className={className} />;
  }

  return <SparklesIcon className={className} />;
}

export function LFGRolePicker({
  profileSummary,
  roleOptions,
  setupHref,
}: LFGRolePickerProps) {
  const [selectedRole, setSelectedRole] = useState<CompetitiveRole | null>(null);

  const selectedRoleOption =
    roleOptions.find((roleOption) => roleOption.role === selectedRole) ?? null;
  const rankIconSrc = getRankIconSrc(selectedRoleOption?.rankTier);
  const postingAsLabel = selectedRoleOption
    ? COMPETITIVE_ROLE_LABELS[selectedRoleOption.role]
    : null;

  return (
    <div className="mt-4">
      <h2 className="text-sm font-semibold text-zinc-100">Pick a role</h2>
      <div className="mt-3 flex flex-wrap gap-3">
        {roleOptions.map((roleOption) => {
          const isSelected = roleOption.role === selectedRole;

          return (
            <button
              key={roleOption.role}
              type="button"
              aria-pressed={isSelected}
              onClick={() => setSelectedRole(roleOption.role)}
              className={`inline-flex h-11 items-center gap-2 rounded-full border px-4 text-sm font-semibold transition ${
                isSelected
                  ? "border-sky-400/55 bg-sky-400/10 text-sky-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
                  : "border-zinc-800 bg-zinc-950/80 text-zinc-300 hover:border-zinc-700 hover:bg-zinc-900 hover:text-zinc-100"
              }`}
            >
              {getRoleIcon(
                roleOption.role,
                `h-4.5 w-4.5 ${
                  roleOption.role === "tank"
                    ? "text-sky-300"
                    : roleOption.role === "dps"
                      ? "text-rose-300"
                      : "text-emerald-300"
                }`
              )}
              {COMPETITIVE_ROLE_LABELS[roleOption.role]}
            </button>
          );
        })}
      </div>
      {postingAsLabel ? (
        <p className="mt-2 text-sm text-zinc-500">Posting as {postingAsLabel}</p>
      ) : null}

      {selectedRoleOption ? (
        selectedRoleOption.isConfigured ? (
          <>
            <div className="mt-3 rounded-[18px] border border-white/8 bg-white/[0.02] px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
              <div className="flex items-start justify-between gap-4">
                <div className="flex min-w-0 gap-3.5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-zinc-950/80 p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                    {rankIconSrc ? (
                      <Image
                        src={rankIconSrc}
                        alt={`${selectedRoleOption.rankLabel} rank icon`}
                        width={28}
                        height={28}
                        className="h-7 w-7 object-contain"
                      />
                    ) : (
                      getRoleIcon(selectedRoleOption.role, "h-4 w-4 text-zinc-500")
                    )}
                  </div>

                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                      Competitive Profile
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="text-[15px] font-bold text-zinc-50">
                        {selectedRoleOption.rankLabel}
                      </span>
                      <span className="text-zinc-600">&bull;</span>
                      <span className="inline-flex items-center gap-1.5 text-sm text-zinc-400">
                        <MapPinnedIcon className="h-3.5 w-3.5" />
                        {profileSummary.region}
                        <span className="text-zinc-500">({profileSummary.timezone})</span>
                      </span>
                    </div>
                  </div>
                </div>

                <Link
                  href={setupHref}
                  className="inline-flex h-8 shrink-0 items-center gap-1 rounded-full border border-white/10 bg-white/[0.025] px-3 text-xs font-semibold text-zinc-300 transition hover:border-white/20 hover:bg-white/[0.045] hover:text-zinc-100"
                >
                  Edit Profile
                  <ChevronRightIcon className="h-4 w-4" />
                </Link>
              </div>

              <div className="mt-3 border-t border-white/8 pt-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-600">
                  Hero Pool
                </p>
                {selectedRoleOption.heroPool.length > 0 ? (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {selectedRoleOption.heroPool.slice(0, 3).map((hero) => (
                      <span
                        key={hero.id}
                        className="inline-flex h-8 items-center gap-2 rounded-full border border-white/8 bg-white/[0.02] px-2.5 pr-3 text-sm font-medium text-zinc-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]"
                      >
                        <span className="relative h-6 w-6 shrink-0 overflow-hidden rounded-full border border-white/10 bg-zinc-900">
                          <Image
                            src={hero.imageSrc}
                            alt={hero.label}
                            fill
                            className="object-cover"
                            sizes="24px"
                          />
                        </span>
                        {hero.label}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-zinc-500">
                    No hero pool selected for this role yet.
                  </p>
                )}
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between rounded-[16px] border border-white/8 bg-white/[0.02] px-4 py-3">
              <p className="text-sm text-zinc-400">
                Posting as{" "}
                <span className="font-medium text-zinc-100">{postingAsLabel}</span>
                {" "}•{" "}
                <span className="font-medium text-zinc-100">
                  {selectedRoleOption.rankLabel}
                </span>
              </p>
              <button
                type="button"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-sky-400 px-5 text-sm font-semibold text-zinc-950 transition hover:bg-sky-300"
              >
                <PlusIcon className="h-4 w-4" />
                Post
              </button>
            </div>
          </>
        ) : (
          <div className="mt-3 rounded-[18px] border border-amber-300/20 bg-amber-300/10 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
            <p className="text-sm leading-6 text-amber-100">
              Set up your {COMPETITIVE_ROLE_LABELS[selectedRoleOption.role].toLowerCase()}{" "}
              competitive profile before posting with this role.
            </p>
            <Link
              href={setupHref}
              className="mt-3 inline-flex h-10 items-center gap-2 rounded-full border border-amber-200/20 bg-black/10 px-4 text-sm font-semibold text-amber-100 transition hover:bg-black/15"
            >
              Open Competitive Profile
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
          </div>
        )
      ) : null}
    </div>
  );
}
