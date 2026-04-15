import type { ReactNode } from "react";

import { SectionCard } from "./section-card";

type SetupSectionProps = {
  platformField: ReactNode;
  regionField: ReactNode;
  serverField: ReactNode;
};

export function SetupSection({
  platformField,
  regionField,
  serverField,
}: SetupSectionProps) {
  return (
    <SectionCard>
      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_1.05fr]">
        {regionField}
        {serverField}
        {platformField}
      </div>
    </SectionCard>
  );
}
