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
    <main className="min-h-screen bg-zinc-950 px-4 py-6 text-zinc-100 sm:px-6 sm:py-8">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <AuthMessage message={message} type={messageType} />

        <section className="rounded-[28px] border border-zinc-800 bg-zinc-900">
          <div className="border-b border-zinc-800 px-6 py-5 sm:px-8">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-zinc-500">
              Account
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-zinc-50">
              Profile settings
            </h1>
            <p className="mt-3 max-w-2xl text-[15px] leading-7 text-zinc-400">
              Update the public Overwatch profile details other players will see
              when they decide whether to queue with you.
            </p>
          </div>

          <div className="px-6 py-5 sm:px-8">
            <div className="grid gap-3 text-sm text-zinc-400 sm:grid-cols-3">
              <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 px-4 py-3">
                <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">
                  Identity
                </p>
                <p className="mt-1 text-zinc-300">Name, handle, and bio</p>
              </div>
              <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 px-4 py-3">
                <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">
                  Play
                </p>
                <p className="mt-1 text-zinc-300">Platform, region, and comms</p>
              </div>
              <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 px-4 py-3">
                <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">
                  Competitive
                </p>
                <p className="mt-1 text-zinc-300">Ranks and queue preferences</p>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[28px] border border-zinc-800 bg-zinc-900 p-6 sm:p-8">
          <AccountForm profile={profile} />
        </section>
      </div>
    </main>
  );
}
