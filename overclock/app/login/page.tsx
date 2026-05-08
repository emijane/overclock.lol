import { redirect } from "next/navigation";
import Image from "next/image";

import { PageContainer } from "@/app/components/page-container";
import { PageReveal } from "@/app/components/page-reveal";
import {
  AuthMessage,
  AuthenticatedPanel,
  UnauthenticatedPanel,
} from "@/app/login/components";
import { createClient } from "@/lib/supabase/server";
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

  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  const isAuthenticated = Boolean(claims?.sub);
  const needsOnboarding = Boolean(user && !profile);

  if (needsOnboarding) {
    redirect("/onboarding");
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
        <section className="mx-auto w-full max-w-xl rounded-[28px]">
          <div className="overflow-hidden rounded-[28px]">
            <PageReveal delay={1}>
              <div className="grid gap-3">
                <AuthMessage message={message} type={messageType} />
                {isAuthenticated ? (
                  <div className="overflow-hidden rounded-[22px] border border-white/8 bg-[#05070b] shadow-[0_24px_70px_rgba(0,0,0,0.24),inset_0_1px_0_rgba(255,255,255,0.04)]">
                    <AuthenticatedPanel
                      email={user?.email ?? claims?.email?.toString()}
                    />
                  </div>
                ) : (
                  <UnauthenticatedPanel />
                )}
              </div>
            </PageReveal>
          </div>
        </section>
      </PageContainer>
    </main>
  );
}
