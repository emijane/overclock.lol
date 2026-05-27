import type { Metadata } from "next";

import { LFGPageShell } from "@/features/lfg/components/lfg-page-shell";

export const metadata: Metadata = {
  title: "LFG | overclock.lol",
  description:
    "Choose a Duos, Stacks, Scrims, or Teams section to browse Overwatch LFG posts.",
};

export default function LFGPage() {
  return (
    <LFGPageShell
      title="LFG"
      description="Choose a community from the desktop sidebar or mobile navigation, then browse posts once the feed is connected."
    />
  );
}
