const heroPoolTemplate = [
  { role: "Tank", heroes: ["Reinhardt", "Winston", "D.Va"] },
  { role: "DPS", heroes: ["Tracer", "Sojourn", "Cassidy"] },
  { role: "Support", heroes: ["Ana", "Kiriko", "Lucio"] },
] as const;

export function PreferredHeroPools() {
  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-950 lg:col-span-2">
      <div className="border-b border-zinc-800 px-5 py-4">
        <h2 className="text-xl font-bold leading-6 text-white">
          Preferred hero pools
        </h2>
        <p className="mt-1 text-[15px] leading-5 text-zinc-500">
          Roles this player queues and the heroes they are comfortable on.
        </p>
      </div>

      <div className="divide-y divide-zinc-800">
        {heroPoolTemplate.map((group) => (
          <div
            key={group.role}
            className="px-5 py-4 transition hover:bg-zinc-900/40"
          >
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                <h3 className="text-[15px] font-bold leading-5 text-white">
                  {group.role}
                </h3>
                <p className="text-[15px] leading-5 text-zinc-500">
                  {group.heroes.length} preferred heroes
                </p>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {group.heroes.map((hero) => (
                  <span
                    key={hero}
                    className="inline-flex h-8 items-center rounded-full border border-zinc-700 bg-zinc-900 px-3 text-[13px] font-semibold leading-none text-zinc-100"
                  >
                    {hero}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
