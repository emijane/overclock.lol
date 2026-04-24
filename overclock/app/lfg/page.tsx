import type { Metadata } from "next";

import { LFGPageShell } from "@/app/lfg/components/lfg-page-shell";

export const metadata: Metadata = {
  title: "LFG | overclock.lol",
  description:
    "Choose a Duos, Stacks, Scrims, or Teams section to browse Overwatch LFG posts.",
};

export default function LFGPage() {
  return (
    <LFGPageShell
      title="LFG"
      description="Use the top navigation to choose a community, then browse posts with filters when the feed is connected."
    />
  );
}
