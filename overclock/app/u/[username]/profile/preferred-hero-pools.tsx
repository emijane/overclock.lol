const heroPoolTemplate = [
  { role: "Tank", heroes: ["Reinhardt", "Winston", "D.Va"] },
  { role: "DPS", heroes: ["Tracer", "Sojourn", "Cassidy"] },
  { role: "Support", heroes: ["Ana", "Kiriko", "Lucio"] },
] as const;

export function PreferredHeroPools() {
  return (
    <section className="rounded-2xl border border-[#3b4657] bg-[#1a1f27] shadow-[0_18px_36px_rgba(0,0,0,0.20)] lg:col-span-2">
      <div className="border-b border-[#313948] px-5 py-4">
        <h2 className="text-xl font-bold leading-6 text-[#f7fafc]">
          Preferred hero pools
        </h2>
        <p className="mt-1 text-[15px] leading-5 text-[#8ea0b8]">
          Roles this player queues and the heroes they are comfortable on.
        </p>
      </div>

      <div className="divide-y divide-[#313948]">
        {heroPoolTemplate.map((group) => (
          <div
            key={group.role}
            className="px-5 py-4 transition hover:bg-[#232a34]"
          >
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                <h3 className="text-[15px] font-bold leading-5 text-[#f7fafc]">
                  {group.role}
                </h3>
                <p className="text-[15px] leading-5 text-[#8ea0b8]">
                  {group.heroes.length} preferred heroes
                </p>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {group.heroes.map((hero) => (
                  <span
                    key={hero}
                    className="inline-flex h-8 items-center rounded-full border border-[#546174] bg-[#212833] px-3 text-[13px] font-semibold leading-none text-[#eef2f7]"
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
