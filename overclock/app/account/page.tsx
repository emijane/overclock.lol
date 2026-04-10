import { redirect } from "next/navigation";

import { AccountForm } from "@/app/account/account-form";
import { AuthMessage } from "@/app/login/components";
import { getCurrentProfile } from "@/lib/profiles/get-current-profile";

type AccountPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function pickValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AccountPage({ searchParams }: AccountPageProps) {
  const params = searchParams ? await searchParams : {};
  const message = pickValue(params.message);
  const messageType = pickValue(params.type);
  const { user, profile } = await getCurrentProfile();

  if (!user) {
    redirect("/login");
  }

  if (!profile) {
    redirect("/onboarding");
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-12 text-slate-100">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <AuthMessage message={message} type={messageType} />
        <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-8">
          <p className="text-sm font-medium uppercase tracking-[0.3em] text-sky-300">
            Account
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">
            Profile settings
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300">
            Update the public Overwatch profile details that other players will
            use to decide whether they want to queue with you.
          </p>
        </section>

        <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-8">
          <AccountForm profile={profile} />
        </section>
      </div>
    </main>
  );
}
