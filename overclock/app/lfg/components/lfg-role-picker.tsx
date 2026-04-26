"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useFormStatus } from "react-dom";
import {
  ArrowRightIcon,
  ChevronRightIcon,
  PlusIcon,
  ShieldIcon,
  SwordsIcon,
} from "lucide-react";

import { COMPETITIVE_ROLE_LABELS } from "@/lib/competitive/competitive-role-labels";
import type { CompetitiveRole } from "@/lib/competitive/competitive-profile-types";

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

function SupportPlusIcon({ className }: { className: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
      fill="currentColor"
    >
      <rect x="9.25" y="3.75" width="5.5" height="16.5" rx="1.2" />
      <rect x="3.75" y="9.25" width="16.5" height="5.5" rx="1.2" />
    </svg>
  );
}

function getRoleIcon(role: CompetitiveRole, className: string) {
  if (role === "tank") {
    return <ShieldIcon className={className} />;
  }

  if (role === "dps") {
    return <SwordsIcon className={className} />;
  }

  return <SupportPlusIcon className={className} />;
}

function CreatePostButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      aria-disabled={pending}
      className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-full bg-sky-400 px-4 text-sm font-semibold text-zinc-950 transition hover:bg-sky-300 sm:w-auto disabled:cursor-not-allowed disabled:bg-sky-400/50 disabled:text-zinc-800"
    >
      <PlusIcon className="h-4 w-4" />
      {pending ? "Creating..." : "Create Post"}
    </button>
  );
}

export function LFGRolePicker({
  profileSummary,
  roleOptions,
  setupHref,
}: LFGRolePickerProps) {
  const [selectedRole, setSelectedRole] = useState<CompetitiveRole | null>(null);
  const { pending } = useFormStatus();

  const selectedRoleOption =
    roleOptions.find((roleOption) => roleOption.role === selectedRole) ?? null;
  const postingAsLabel = selectedRoleOption
    ? COMPETITIVE_ROLE_LABELS[selectedRoleOption.role]
    : null;

  return (
    <div className="mt-3">
      <h2 className="text-sm font-semibold text-zinc-100">Role</h2>
      <div className="mt-2 flex flex-wrap gap-2">
        {roleOptions.map((roleOption) => {
          const isSelected = roleOption.role === selectedRole;

          return (
            <button
              key={roleOption.role}
              type="button"
              aria-pressed={isSelected}
              disabled={pending}
              onClick={() => setSelectedRole(roleOption.role)}
              className={`inline-flex h-9 items-center gap-2 rounded-full border px-3 text-sm font-semibold transition ${
                isSelected
                  ? "border-sky-400/55 bg-sky-400/10 text-sky-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
                  : "border-zinc-800 bg-zinc-950/80 text-zinc-300 hover:border-zinc-700 hover:bg-zinc-900 hover:text-zinc-100"
              } disabled:cursor-not-allowed disabled:opacity-60`}
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
      {selectedRoleOption ? (
        selectedRoleOption.isConfigured ? (
          <>
            <input type="hidden" name="posting_role" value={selectedRoleOption.role} />
            <div className="mt-3 border-t border-white/8 pt-3">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-zinc-300">
                    <span className="inline-flex h-4.5 w-4.5 items-center justify-center">
                      {getRoleIcon(
                        selectedRoleOption.role,
                        selectedRoleOption.role === "tank"
                          ? "h-4 w-4 text-sky-300"
                          : selectedRoleOption.role === "dps"
                            ? "h-4 w-4 text-rose-300"
                            : "h-4 w-4 text-emerald-300"
                      )}
                    </span>
                    <span className="font-medium text-zinc-100">{postingAsLabel}</span>
                    <span className="text-zinc-600">&bull;</span>
                    <span className="font-medium text-zinc-100">
                      {selectedRoleOption.rankLabel}
                    </span>
                    <span className="text-zinc-600">&bull;</span>
                    <span className="text-zinc-400">
                      {profileSummary.region}
                      {profileSummary.timezone
                        ? ` (${profileSummary.timezone})`
                        : ""}
                    </span>
                  </div>
                </div>

                <Link
                  href={setupHref}
                  className="inline-flex h-7 shrink-0 items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-400 transition hover:text-zinc-100"
                >
                  Edit Profile
                  <ChevronRightIcon className="h-4 w-4" />
                </Link>
              </div>

              <div className="mt-2.5">
                {selectedRoleOption.heroPool.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {selectedRoleOption.heroPool.slice(0, 3).map((hero) => (
                      <div
                        key={hero.id}
                        title={hero.label}
                        aria-label={hero.label}
                        className="relative h-9 w-9 overflow-hidden rounded-[10px] border border-white/8 bg-zinc-900/90"
                      >
                        <Image
                          src={hero.imageSrc}
                          alt={hero.label}
                          fill
                          className="object-cover"
                          sizes="36px"
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-zinc-500">
                    No hero pool selected for this role yet.
                  </p>
                )}
              </div>
            </div>
            <div className="mt-3 flex flex-col gap-2.5 border-t border-white/8 pt-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="min-w-0 text-sm text-zinc-400">
                Posting as{" "}
                <span className="font-medium text-zinc-100">{postingAsLabel}</span>{" "}
                <span className="text-zinc-500">&bull;</span>{" "}
                <span className="font-medium text-zinc-100">
                  {selectedRoleOption.rankLabel}
                </span>
              </p>
              <CreatePostButton />
            </div>
          </>
        ) : (
          <div className="mt-2.5 rounded-[18px] border border-amber-300/20 bg-amber-300/10 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
            <p className="text-sm leading-6 text-amber-100">
              Set up your {COMPETITIVE_ROLE_LABELS[selectedRoleOption.role].toLowerCase()}{" "}
              competitive profile before posting with this role.
            </p>
            <Link
              href={setupHref}
              className="mt-3 inline-flex h-9 items-center gap-2 rounded-full border border-amber-200/20 bg-black/10 px-3.5 text-sm font-semibold text-amber-100 transition hover:bg-black/15"
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
