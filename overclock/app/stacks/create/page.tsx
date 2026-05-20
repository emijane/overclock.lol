import type { Metadata } from "next";

import { LFGPageShell } from "@/features/lfg/components/lfg-page-shell";

export const metadata: Metadata = {
  title: "Create Stack Post | overclock.lol",
  description: "Create a stack listing for group queue on overclock.lol.",
};

export default function CreateStacksPostPage() {
  return (
    <LFGPageShell
      animateOnLoad
      breadcrumbHref="/stacks"
      breadcrumbLabel="Stacks"
      composerMode="inline"
      description=""
      showFeed={false}
      title="Create a Post"
      type="stacks"
    />
  );
}
