import { redirect } from "next/navigation";

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
      <div className="mx-auto flex min-h-[calc(100vh-6rem)] w-full max-w-xl flex-col justify-center gap-6">
        <AuthMessage message={message} type={messageType} />
        {isAuthenticated ? (
          <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-8">
            <AuthenticatedPanel email={user?.email ?? claims?.email?.toString()} />
          </div>
        ) : (
          <UnauthenticatedPanel />
        )}
      </div>
    </main>
  );
}
