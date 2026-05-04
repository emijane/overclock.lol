import type { ReactNode } from "react";

import { SectionCard } from "./section-card";

type SetupSectionProps = {
  regionField: ReactNode;
  serverField: ReactNode;
  trailingField?: ReactNode;
};

export function SetupSection({
  regionField,
  serverField,
  trailingField,
}: SetupSectionProps) {
  return (
    <SectionCard>
      <div
        className={`grid gap-3 ${
          trailingField
            ? "md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_1.05fr]"
            : "md:grid-cols-2"
        }`}
      >
        {regionField}
        {serverField}
        {trailingField}
      </div>
    </SectionCard>
  );
}
