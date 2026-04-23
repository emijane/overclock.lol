"use client";

import Link from "next/link";
import { type FormEvent, useState } from "react";
import { CheckIcon, PlusCircleIcon } from "lucide-react";

const REQUIREMENT_OPTIONS = ["Mic Required", "18+ Only"] as const;

type RequirementOption = (typeof REQUIREMENT_OPTIONS)[number];

type CompetitiveProfileSettingsProps = {
    configuredRoleCount: number;
};

type ToggleChipProps = {
    isDisabled?: boolean;
    isSelected: boolean;
    label: string;
    onToggle: () => void;
};

function ToggleChip({
    isDisabled = false,
    isSelected,
    label,
    onToggle,
}: ToggleChipProps) {
    return (
        <button
            type="button"
            aria-pressed={isSelected}
            disabled={isDisabled}
            onClick={onToggle}
            className={`inline-flex h-9 items-center gap-2 rounded-full border px-3.5 text-sm font-semibold transition active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/70 disabled:cursor-not-allowed disabled:opacity-40 disabled:active:scale-100 ${
                isSelected
                    ? "border-sky-300/70 bg-sky-300/15 text-sky-50 shadow-[0_0_24px_rgba(56,189,248,0.2),inset_0_1px_0_rgba(255,255,255,0.16)]"
                    : "border-white/10 bg-white/[0.035] text-zinc-400 hover:border-white/25 hover:bg-white/[0.065] hover:text-zinc-100"
            }`}
        >
            <span
                className={`grid h-4 w-4 place-items-center rounded-full border transition ${
                    isSelected
                        ? "border-sky-200 bg-sky-200 text-zinc-950"
                        : "border-white/15 text-transparent"
                }`}
            >
                <CheckIcon className="h-3 w-3" />
            </span>
            {label}
        </button>
    );
}

function toggleSelection<T extends string>(items: T[], item: T) {
    return items.includes(item)
        ? items.filter((currentItem) => currentItem !== item)
        : [...items, item];
}

export function CompetitiveProfileSettings({
    configuredRoleCount,
}: CompetitiveProfileSettingsProps) {
    const [requirements, setRequirements] = useState<RequirementOption[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [showSavedToast, setShowSavedToast] = useState(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (!hasUnsavedChanges) {
            return;
        }

        setIsSaving(true);
        window.setTimeout(() => {
            setHasUnsavedChanges(false);
            setIsSaving(false);
            setShowSavedToast(true);
            window.setTimeout(() => setShowSavedToast(false), 1600);
        }, 500);
    }

    return (
        <section className="border-t border-white/10 px-5 py-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] sm:px-6 sm:py-7">
            <form
                onSubmit={handleSubmit}
                className="relative"
            >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="max-w-2xl">
                        <div className="flex flex-wrap items-center gap-3">
                            <h2 className="text-lg font-semibold tracking-[-0.02em] text-zinc-50">
                                LFG Preferences
                            </h2>
                            <span className="inline-flex h-7 items-center rounded-full border border-white/10 bg-white/[0.035] px-2.5 text-[11px] font-semibold text-zinc-300">
                                Playable Roles: {configuredRoleCount}
                            </span>
                        </div>
                        <p className="mt-1.5 text-sm leading-6 text-zinc-400">
                            These preferences prefill your LFG and LFD posts. You can change them anytime when creating a post.
                        </p>
                    </div>

                    <Link
                        href="/duos"
                        className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-full border border-sky-300/35 bg-sky-300/12 px-4 text-sm font-semibold text-sky-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] transition hover:border-sky-300/55 hover:bg-sky-300/18 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
                    >
                        <PlusCircleIcon className="h-4 w-4" />
                        Create Post
                    </Link>
                </div>

                {showSavedToast ? (
                    <div className="mt-4 inline-flex h-9 items-center gap-2 rounded-full border border-emerald-300/25 bg-emerald-300/12 px-3 text-sm font-semibold text-emerald-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]">
                        <CheckIcon className="h-4 w-4" />
                        Preferences updated
                    </div>
                ) : null}

                <div className="mt-5 grid gap-3.5">
                    <div className="grid gap-1.5">
                        <div className="flex items-baseline gap-1.5">
                            <p className="text-sm font-semibold text-zinc-100">
                                Requirements
                            </p>
                            <p className="text-[10px] font-medium text-zinc-600/75">
                                Optional
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-1.5">
                            {REQUIREMENT_OPTIONS.map((requirement) => (
                                <ToggleChip
                                    key={requirement}
                                    isSelected={requirements.includes(requirement)}
                                    label={requirement}
                                    onToggle={() =>
                                        setRequirements((currentRequirements) => {
                                            setShowSavedToast(false);
                                            setHasUnsavedChanges(true);
                                            return toggleSelection(
                                                currentRequirements,
                                                requirement
                                            );
                                        })
                                    }
                                />
                            ))}
                        </div>
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={!hasUnsavedChanges || isSaving}
                    className="mt-5 inline-flex h-10 w-full items-center justify-center gap-2 rounded-full bg-sky-300/75 px-4 text-sm font-semibold text-zinc-950 transition hover:bg-sky-300/90 active:bg-sky-400/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 disabled:cursor-not-allowed disabled:bg-white/[0.055] disabled:text-zinc-600"
                >
                    {isSaving ? (
                        "Saving..."
                    ) : (
                        "Save Defaults"
                    )}
                </button>
            </form>
        </section>
    );
}
