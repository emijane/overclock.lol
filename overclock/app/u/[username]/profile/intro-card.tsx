type IntroItem = {
  label: string;
  value: string;
};

type IntroCardProps = {
  items: IntroItem[];
};

export function IntroCard({ items }: IntroCardProps) {
  return (
    <aside className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
      <h2 className="text-xl font-bold leading-6 text-white">Intro</h2>
      <div className="mt-4 grid gap-3.5">
        {items.length > 0 ? (
          items.map((item) => (
            <div
              key={item.label}
              className="flex items-center gap-3 text-[15px] leading-5"
            >
              <span className="h-2 w-2 rounded-full bg-zinc-300" />
              <span className="text-zinc-500">{item.label}</span>
              <span className="ml-auto font-medium text-zinc-100">
                {item.value}
              </span>
            </div>
          ))
        ) : (
          <p className="text-[15px] leading-5 text-zinc-500">
            No profile details added yet.
          </p>
        )}
      </div>
    </aside>
  );
}
