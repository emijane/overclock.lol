import { redirect } from "next/navigation";

import { getCurrentProfile } from "@/lib/profiles/get-current-profile";

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

export default async function HeroPoolsPage() {
  const { user, profile } = await getCurrentProfile();

  if (!user) {
    redirect("/login");
  }

  if (!profile) {
    redirect("/onboarding");
  }

  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-5 text-zinc-100 sm:px-6 sm:py-6">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
        <section className="rounded-[28px] border border-zinc-800 bg-zinc-900 px-5 py-5 sm:px-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-zinc-500">
            Setup
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-zinc-50">
            Hero Pools
          </h1>
        </section>

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
          <div className="rounded-[22px] border border-dashed border-zinc-800 bg-zinc-950/70 px-4 py-8 text-sm text-zinc-500">
            Role selection goes here next.
          </div>
        </section>
      </div>
    </main>
  );
}
