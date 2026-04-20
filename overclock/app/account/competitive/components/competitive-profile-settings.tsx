"use client";

import { type FormEvent, useState } from "react";
import { CheckIcon } from "lucide-react";

const GOAL_OPTIONS = [
    "Casual",
    "Competitive",
    "Climbing",
    "Learning",
    "Scrims",
    "Tournament",
] as const;

const REQUIREMENT_OPTIONS = ["Mic Required", "18+ Only"] as const;

type GoalOption = (typeof GOAL_OPTIONS)[number];
type RequirementOption = (typeof REQUIREMENT_OPTIONS)[number];

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

export function CompetitiveProfileSettings() {
    const [goals, setGoals] = useState<GoalOption[]>([]);
    const [requirements, setRequirements] = useState<RequirementOption[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [isSaved, setIsSaved] = useState(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

    function toggleGoal(goal: GoalOption) {
        setIsSaved(false);
        setGoals((currentGoals) => {
            if (currentGoals.includes(goal)) {
                setHasUnsavedChanges(true);
                return currentGoals.filter((currentGoal) => currentGoal !== goal);
            }

            if (currentGoals.length >= 2) {
                return currentGoals;
            }

            setHasUnsavedChanges(true);
            return [...currentGoals, goal];
        });
    }

    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (!hasUnsavedChanges) {
            return;
        }

        setIsSaving(true);
        window.setTimeout(() => {
            setHasUnsavedChanges(false);
            setIsSaving(false);
            setIsSaved(true);
            window.setTimeout(() => setIsSaved(false), 1600);
        }, 500);
    }

    return (
        <section className="border-t border-white/10 px-5 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] sm:px-6">
            <form
                onSubmit={handleSubmit}
                className="rounded-[20px] border border-white/10 bg-white/[0.03] p-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] sm:p-4"
            >
                <p className="text-sm text-zinc-500">
                    Choose how you want to appear in LFG
                </p>

                <div className="mt-4 grid gap-3.5">
                    <div className="grid gap-1.5">
                        <div className="grid gap-px">
                            <p className="text-sm font-semibold text-zinc-100">
                                Goal
                            </p>
                            <p className="text-[10px] font-medium text-zinc-600/80">
                                Select up to 2
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-1.5">
                            {GOAL_OPTIONS.map((goal) => (
                                <ToggleChip
                                    key={goal}
                                    isDisabled={
                                        goals.length >= 2 && !goals.includes(goal)
                                    }
                                    isSelected={goals.includes(goal)}
                                    label={goal}
                                    onToggle={() => toggleGoal(goal)}
                                />
                            ))}
                        </div>
                    </div>

                    <div className="grid gap-1.5">
                        <div className="flex items-baseline gap-1.5">
                            <p className="text-sm font-semibold text-zinc-100">
                                Looking For
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
                                            setIsSaved(false);
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
                    ) : isSaved ? (
                        <>
                            Saved
                            <CheckIcon className="h-4 w-4" />
                        </>
                    ) : (
                        "Update Preferences"
                    )}
                </button>
            </form>
        </section>
    );
}
