import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { AuthenticatedWorkspaceShell } from "@/components/app-shell/authenticated-workspace-shell";
import { PageReveal } from "@/components/app-shell/page-reveal";
import { SocialPageView } from "@/features/chat/components/social-page-view";
import { getChatThreadPageDto } from "@/lib/pages/social-page-dto";
import { getCurrentProfile } from "@/lib/profiles/get-current-profile";

type DuoChatPageProps = {
  params: Promise<{ threadId: string }>;
};

export const metadata: Metadata = {
  title: "Duo Chat | overclock.lol",
  description: "Read and continue accepted Duo conversations with your connected players.",
};

export default async function DuoChatPage({ params }: DuoChatPageProps) {
  const { threadId } = await params;
  const { user, profile } = await getCurrentProfile();

  if (!user) {
    redirect("/login");
  }

  if (!profile) {
    redirect("/onboarding");
  }

  const dto = await getChatThreadPageDto(threadId);

  if (dto === null) {
    notFound();
  }

  return (
    <AuthenticatedWorkspaceShell balanceDesktopCenter={false} centerClassName="w-full max-w-5xl">
      <div className="flex max-h-[calc(100vh-4rem)] min-h-0 flex-1 flex-col overflow-hidden rounded-[16px] border border-white/[0.05] bg-[linear-gradient(180deg,rgba(255,255,255,0.018)_0%,rgba(255,255,255,0.008)_28%,rgba(7,7,9,0.96)_100%)] shadow-[0_16px_36px_rgba(0,0,0,0.22)] sm:rounded-[10px] sm:border-0 sm:bg-[linear-gradient(180deg,rgba(255,255,255,0.012)_0%,rgba(255,255,255,0.006)_100%)] sm:shadow-none">
        <PageReveal variant="fade" className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <SocialPageView
            activeThread={dto.activeThread}
            initialMessages={dto.initialMessages}
            threads={dto.threads}
            viewer={dto.viewer}
          />
        </PageReveal>
      </div>
    </AuthenticatedWorkspaceShell>
  );
}
