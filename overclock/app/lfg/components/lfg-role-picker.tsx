"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useFormStatus } from "react-dom";
import {
  ArrowRightIcon,
  PlusIcon,
  ShieldIcon,
  SwordsIcon,
} from "lucide-react";

import { COMPETITIVE_ROLE_LABELS } from "@/lib/competitive/competitive-role-labels";
import {
  COMPETITIVE_ROLE_OPTIONS,
  type CompetitiveRole,
} from "@/lib/competitive/competitive-profile-types";

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

const LOOKING_FOR_ALL_VALUE = "all";

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

function getRoleButtonClassName(isSelected: boolean) {
  return `inline-flex h-8 items-center gap-1.5 rounded-full border px-2.5 text-[13px] font-semibold transition-all duration-200 ${
    isSelected
      ? "border-white/20 bg-white/[0.08] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
      : "border-zinc-800 bg-zinc-950/80 text-zinc-300 hover:border-zinc-700 hover:bg-zinc-900 hover:text-zinc-100"
  }`;
}

function getLookingForButtonClassName(isSelected: boolean) {
  return `inline-flex h-8 items-center gap-1.5 rounded-full border px-2.5 text-[13px] font-semibold transition-all duration-200 ${
    isSelected
      ? "border-white/20 bg-white/[0.08] text-white"
      : "border-white/5 bg-white/[0.03] text-zinc-400 hover:bg-white/[0.045] hover:text-zinc-200"
  }`;
}

function getLookingForAllButtonClassName(isSelected: boolean) {
  return `inline-flex h-8 items-center gap-1.5 rounded-full border border-dashed px-2.5 text-[13px] font-semibold transition-all duration-200 ${
    isSelected
      ? "border-white/20 bg-white/[0.08] text-white"
      : "border-white/6 bg-white/[0.02] text-zinc-500 hover:border-white/10 hover:bg-white/[0.035] hover:text-zinc-300"
  }`;
}

function CreatePostButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      aria-disabled={pending}
      className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.06] px-4 text-sm font-semibold text-zinc-50 transition hover:border-white/[0.12] hover:bg-white/[0.09] hover:text-white sm:w-auto disabled:cursor-not-allowed disabled:border-white/[0.05] disabled:bg-white/[0.04] disabled:text-zinc-500"
    >
      <PlusIcon className="h-4 w-4" />
      {pending ? "Creating..." : "Create post"}
    </button>
  );
}

export function LFGRolePicker({
  profileSummary,
  roleOptions,
  setupHref,
}: LFGRolePickerProps) {
  const [selectedRole, setSelectedRole] = useState<CompetitiveRole | null>(null);
  const [lookingForRoles, setLookingForRoles] = useState<string[]>([
    LOOKING_FOR_ALL_VALUE,
  ]);
  const { pending } = useFormStatus();
  const submittedLookingForRoles = lookingForRoles.includes(LOOKING_FOR_ALL_VALUE)
    ? [...COMPETITIVE_ROLE_OPTIONS]
    : lookingForRoles;

  const selectedRoleOption =
    roleOptions.find((roleOption) => roleOption.role === selectedRole) ?? null;
  const postingAsLabel = selectedRoleOption
    ? COMPETITIVE_ROLE_LABELS[selectedRoleOption.role]
    : null;

  function toggleLookingForRole(role: CompetitiveRole | typeof LOOKING_FOR_ALL_VALUE) {
    setLookingForRoles((currentRoles) => {
      if (role === LOOKING_FOR_ALL_VALUE) {
        return [LOOKING_FOR_ALL_VALUE];
      }

      const nextRoles = currentRoles.filter(
        (currentRole) => currentRole !== LOOKING_FOR_ALL_VALUE
      );

      if (nextRoles.includes(role)) {
        const filteredRoles = nextRoles.filter((currentRole) => currentRole !== role);
        return filteredRoles.length > 0 ? filteredRoles : [LOOKING_FOR_ALL_VALUE];
      }

      if (nextRoles.length >= 2) {
        return nextRoles;
      }

      return [...nextRoles, role];
    });
  }

  return (
    <div className="mt-3">
      <div>
        <h2 className="text-sm font-semibold text-zinc-50">Role</h2>
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
                className={`${getRoleButtonClassName(isSelected)} disabled:cursor-not-allowed disabled:opacity-60`}
              >
                {getRoleIcon(roleOption.role, "h-3.5 w-3.5 text-white")}
                {COMPETITIVE_ROLE_LABELS[roleOption.role]}
              </button>
            );
          })}
        </div>
      </div>
      <div className="mt-2.5">
        <h2 className="text-sm font-medium text-zinc-400">Looking for</h2>
        <p className="mt-1 text-xs text-white/35">
          Pick up to two roles, or choose All.
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {roleOptions.map((roleOption) => {
            const isSelected = lookingForRoles.includes(roleOption.role);

            return (
              <button
                key={`looking-for-${roleOption.role}`}
                type="button"
                aria-pressed={isSelected}
                disabled={pending}
                onClick={() => toggleLookingForRole(roleOption.role)}
                className={`${getLookingForButtonClassName(isSelected)} disabled:cursor-not-allowed disabled:opacity-60`}
              >
                {getRoleIcon(roleOption.role, "h-3.5 w-3.5 text-white")}
                {COMPETITIVE_ROLE_LABELS[roleOption.role]}
              </button>
            );
          })}
          <button
            type="button"
            aria-pressed={lookingForRoles.includes(LOOKING_FOR_ALL_VALUE)}
            disabled={pending}
            onClick={() => toggleLookingForRole(LOOKING_FOR_ALL_VALUE)}
            className={`${getLookingForAllButtonClassName(
              lookingForRoles.includes(LOOKING_FOR_ALL_VALUE)
            )} disabled:cursor-not-allowed disabled:opacity-60`}
          >
            All
          </button>
        </div>
      </div>
      {selectedRoleOption ? (
        selectedRoleOption.isConfigured ? (
          <>
            <input type="hidden" name="posting_role" value={selectedRoleOption.role} />
            <div className="mt-2.5 pt-2.5">
              <div className="min-w-0">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-zinc-300">
                    <span className="text-zinc-500">Posting as</span>
                    <span className="font-semibold text-zinc-100">
                      {selectedRoleOption.rankLabel} {postingAsLabel}
                    </span>
                    <span className="text-zinc-400">
                      / {profileSummary.region} {profileSummary.timezone}
                    </span>
                  </div>

                  {selectedRoleOption.heroPool.length > 0 ? (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {selectedRoleOption.heroPool.slice(0, 3).map((hero) => (
                        <div
                          key={hero.id}
                          title={hero.label}
                          aria-label={hero.label}
                          className="relative h-9 w-9 overflow-hidden rounded-[10px] bg-zinc-900/90"
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
            </div>
            <div className="mt-2.5 flex flex-col gap-2.5 pt-2.5 sm:flex-row sm:items-center sm:justify-end">
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
      {submittedLookingForRoles.map((role) => (
        <input key={`looking-for-input-${role}`} type="hidden" name="looking_for_roles" value={role} />
      ))}
    </div>
  );
}
