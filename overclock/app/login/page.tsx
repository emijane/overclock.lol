import { redirect } from "next/navigation";

import { DarkPageShell } from "@/components/app-shell/dark-page-shell";
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
    <DarkPageShell
      className="flex"
      containerClassName="flex flex-1 flex-col justify-center"
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
    </DarkPageShell>
  );
}
