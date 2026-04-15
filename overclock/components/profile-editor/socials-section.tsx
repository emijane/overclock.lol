import type { ReactNode } from "react";

import { SectionCard } from "./section-card";

type SocialsSectionProps = {
  discordVisibility?: ReactNode;
  fields: ReactNode;
};

export function SocialsSection({
  discordVisibility,
  fields,
}: SocialsSectionProps) {
  return (
    <SectionCard title="Socials">
      {discordVisibility ? <div className="mb-3">{discordVisibility}</div> : null}
      {fields}
    </SectionCard>
  );
}
