import { redirect } from "next/navigation";

import { PageContainer } from "@/app/components/page-container";
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
    <main className="min-h-screen bg-slate-950 px-6 py-12 text-slate-100">
      <PageContainer className="flex min-h-[calc(100vh-6rem)] flex-col justify-center gap-6">
        <AuthMessage message={message} type={messageType} />
        <div className="w-full max-w-xl">
          {isAuthenticated ? (
            <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-8">
              <AuthenticatedPanel
                email={user?.email ?? claims?.email?.toString()}
              />
            </div>
          ) : (
            <UnauthenticatedPanel />
          )}
        </div>
      </PageContainer>
    </main>
  );
}
