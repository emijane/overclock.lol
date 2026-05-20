import { redirect } from "next/navigation";

import { PageContainer } from "@/components/app-shell/page-container";
import { PageReveal } from "@/components/app-shell/page-reveal";
import { AuthMessage, UnauthenticatedPanel } from "@/features/auth/components";
import { getCurrentProfile } from "@/lib/profiles/get-current-profile";

type LoginPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function pickValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

// The login route is also the auth gate for onboarding. Signed-in users without
// a profile are redirected to `/onboarding`; signed-out users stay here and see
// the Discord login card.
export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = searchParams ? await searchParams : {};
  const message = pickValue(params.message);
  const messageType = pickValue(params.type);

  const { user, profile } = await getCurrentProfile();
  const needsOnboarding = Boolean(user && !profile);

  if (needsOnboarding) {
    redirect("/onboarding");
  }

  if (user && profile?.username) {
    redirect(`/u/${profile.username}`);
  }

  return (
    <main className="relative flex flex-1 flex-col bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.04),transparent_30%),radial-gradient(circle_at_20%_0%,rgba(56,189,248,0.08),transparent_24%),radial-gradient(circle_at_80%_10%,rgba(255,255,255,0.03),transparent_18%),#09090b] px-4 py-6 text-zinc-100 sm:px-6 sm:py-8">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.7)_0.6px,transparent_0.95px)] bg-[length:11px_11px] opacity-68 [mask-image:radial-gradient(circle_at_34%_12%,black_0,black_12%,transparent_28%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(224,242,254,0.68)_0.6px,transparent_0.95px)] bg-[length:11px_11px] opacity-64 [mask-image:radial-gradient(circle_at_72%_62%,black_0,black_10%,transparent_24%)]"
      />
      <PageContainer
        className="relative z-10 flex flex-1 flex-col justify-center"
        maxWidthClassName="max-w-4xl"
      >
        <section className="relative mx-auto w-full max-w-[42rem] rounded-[28px]">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-10 inset-y-8 rounded-full bg-white/[0.05] blur-3xl"
          />
          <div className="overflow-hidden rounded-[28px]">
            <PageReveal delay={1}>
              <div className="relative z-10 grid gap-3">
                <AuthMessage message={message} type={messageType} />
                <UnauthenticatedPanel />
              </div>
            </PageReveal>
          </div>
        </section>
      </PageContainer>
    </main>
  );
}
