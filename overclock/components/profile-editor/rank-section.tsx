import type { ReactNode } from "react";

import { SectionCard } from "./section-card";

type RankSectionProps = {
  controls: ReactNode;
  current: ReactNode;
  currentLabel?: string;
  title?: string;
};

export function RankSection({
  controls,
  current,
  currentLabel = "Current",
  title,
}: RankSectionProps) {
  return (
    <SectionCard title={title}>
      <div className="grid gap-3 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="grid gap-2 text-sm text-zinc-300">{controls}</div>
        <div className="grid gap-2 text-sm text-zinc-300">
          <span>{currentLabel}</span>
          {current}
        </div>
      </div>
    </SectionCard>
  );
}
