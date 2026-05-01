import type { Metadata } from "next";

import { LFGPageShell } from "@/app/lfg/components/lfg-page-shell";

export const metadata: Metadata = {
  title: "Create Duo Post | overclock.lol",
  description: "Create a duo listing for ranked or casual queue on overclock.lol.",
};

export default function CreateDuosPostPage() {
  return (
    <LFGPageShell
      composerMode="inline"
      description="Create a duo listing for ranked or casual queue."
      showFeed={false}
      title="Duos"
      type="duos"
    />
  );
}
