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
    <main className="min-h-screen bg-zinc-950 px-4 py-5 text-zinc-100 sm:px-6 sm:py-6">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
        <AuthMessage message={message} type={messageType} />

        <section className="rounded-[28px] border border-zinc-800 bg-zinc-900 px-5 py-5 sm:px-6">
          <h1 className="text-2xl font-semibold tracking-[-0.04em] text-zinc-50">
            Account
          </h1>
        </section>

        <section className="rounded-[28px] border border-zinc-800 bg-zinc-900 p-5 sm:p-6">
          <AccountForm profile={profile} />
        </section>
      </div>
    </main>
  );
}
