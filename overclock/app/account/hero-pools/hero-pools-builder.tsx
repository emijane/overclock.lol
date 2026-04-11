"use client";

import { ShieldIcon, SwordsIcon, CrossIcon } from "lucide-react";
import { useState } from "react";

const ROLE_OPTIONS = [
  {
    id: "tank",
    label: "Tank",
    Icon: ShieldIcon,
  },
  {
    id: "dps",
    label: "DPS",
    Icon: SwordsIcon,
  },
  {
    id: "support",
    label: "Support",
    Icon: CrossIcon,
  },
] as const;

type RoleId = (typeof ROLE_OPTIONS)[number]["id"];

const steps = [
  {
    number: "01",
    title: "Roles",
    description: "Choose the roles you play.",
  },
  {
    number: "02",
    title: "Heroes",
    description: "Pick up to five heroes for each role.",
  },
  {
    number: "03",
    title: "Preview",
    description: "Review the hero pools we build from your picks.",
  },
] as const;

export function HeroPoolsBuilder() {
  const [selectedRoles, setSelectedRoles] = useState<RoleId[]>([]);

  function toggleRole(role: RoleId) {
    setSelectedRoles((current) =>
      current.includes(role)
        ? current.filter((value) => value !== role)
        : [...current, role]
    );
  }

  return (
    <>
      <section className="rounded-[28px] border border-zinc-800 bg-zinc-900 p-5 sm:p-6">
        <div className="grid gap-3 md:grid-cols-3">
          {steps.map((step) => (
            <section
              key={step.number}
              className="rounded-[22px] border border-zinc-800 bg-zinc-950/70 px-4 py-4"
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-500">
                {step.number}
              </p>
              <h2 className="mt-2 text-sm font-semibold text-zinc-100">
                {step.title}
              </h2>
              <p className="mt-1 text-sm leading-6 text-zinc-400">
                {step.description}
              </p>
            </section>
          ))}
        </div>
      </section>

      <section className="rounded-[28px] border border-zinc-800 bg-zinc-900 p-5 sm:p-6">
        <div className="grid gap-3 sm:grid-cols-3">
          {ROLE_OPTIONS.map((role) => {
            const isSelected = selectedRoles.includes(role.id);
            const { Icon } = role;

            return (
              <button
                key={role.id}
                type="button"
                onClick={() => toggleRole(role.id)}
                aria-pressed={isSelected}
                className={`rounded-[22px] border px-4 py-5 text-left transition ${
                  isSelected
                    ? "border-sky-400 bg-sky-400/12 text-zinc-50"
                    : "border-zinc-800 bg-zinc-950/70 text-zinc-300 hover:border-zinc-700 hover:text-zinc-100"
                }`}
              >
                <Icon className="h-5 w-5" />
                <p className="mt-4 text-base font-semibold">{role.label}</p>
              </button>
            );
          })}
        </div>
      </section>

      <section className="rounded-[28px] border border-zinc-800 bg-zinc-900 p-5 sm:p-6">
        <div className="rounded-[22px] border border-dashed border-zinc-800 bg-zinc-950/70 px-4 py-8 text-sm text-zinc-500">
          {selectedRoles.length > 0
            ? "Hero selection comes next."
            : "Choose at least one role to continue."}
        </div>
      </section>
    </>
  );
}
