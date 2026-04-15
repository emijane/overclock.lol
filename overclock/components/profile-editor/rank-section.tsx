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
      <div className="grid gap-3">
        <div className="grid gap-2 text-sm text-zinc-300">
          <span>{currentLabel}</span>
          {current ? current : null}
        </div>
        <div className="grid gap-2 text-sm text-zinc-300">{controls}</div>
      </div>
    </SectionCard>
  );
}
