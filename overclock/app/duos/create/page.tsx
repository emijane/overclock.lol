import type { Metadata } from "next";

import { LFGPageShell } from "@/app/lfg/components/lfg-page-shell";

export const metadata: Metadata = {
  title: "Create Duo Post | overclock.lol",
  description: "Create a duo listing for ranked or casual queue on overclock.lol.",
};

export default function CreateDuosPostPage() {
  return (
    <LFGPageShell
      animateOnLoad
      breadcrumbHref="/duos"
      breadcrumbLabel="Duos"
      composerMode="inline"
      description=""
      showFeed={false}
      title="Create a Post"
      type="duos"
    />
  );
}
