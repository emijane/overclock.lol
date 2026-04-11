const heroPoolTemplate = [
  { role: "Tank", heroes: ["Reinhardt", "Winston", "D.Va"] },
  { role: "DPS", heroes: ["Tracer", "Sojourn", "Cassidy"] },
  { role: "Support", heroes: ["Ana", "Kiriko", "Lucio"] },
] as const;

export function PreferredHeroPools() {
  return (
    <section className="rounded-2xl border border-[#d7dee8] bg-[#ffffff] lg:col-span-2">
      <div className="border-b border-[#e5e7eb] px-5 py-4">
        <h2 className="text-xl font-bold leading-6 text-[#111827]">
          Preferred hero pools
        </h2>
        <p className="mt-1 text-[15px] leading-5 text-[#6b7280]">
          Roles this player queues and the heroes they are comfortable on.
        </p>
      </div>

      <div className="divide-y divide-[#e5e7eb]">
        {heroPoolTemplate.map((group) => (
          <div
            key={group.role}
            className="px-5 py-4 transition hover:bg-[#f8fafc]"
          >
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                <h3 className="text-[15px] font-bold leading-5 text-[#111827]">
                  {group.role}
                </h3>
                <p className="text-[15px] leading-5 text-[#6b7280]">
                  {group.heroes.length} preferred heroes
                </p>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {group.heroes.map((hero) => (
                  <span
                    key={hero}
                    className="inline-flex h-8 items-center rounded-full border border-[#d7dee8] bg-[#f7f9fc] px-3 text-[13px] font-semibold leading-none text-[#111827]"
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
