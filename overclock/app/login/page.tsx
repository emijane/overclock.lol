import {
  AuthMessage,
  AuthenticatedPanel,
  LoginHero,
  SecurityChecklist,
  UnauthenticatedPanel,
} from "@/app/login/components";
import { createClient } from "@/lib/supabase/server";

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

  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAuthenticated = Boolean(claims?.sub);

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-12 text-slate-100">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-10">
        <LoginHero />
        <AuthMessage message={message} type={messageType} />

        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <SecurityChecklist />

          <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-8">
            {isAuthenticated ? (
              <AuthenticatedPanel
                email={user?.email ?? claims?.email?.toString()}
              />
            ) : (
              <UnauthenticatedPanel />
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
