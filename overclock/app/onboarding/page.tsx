import { redirect } from "next/navigation";

import { signOut } from "@/app/auth/actions";
import { getCurrentProfile } from "@/lib/profiles/get-current-profile";

export default async function OnboardingPage() {
  const { user, profile } = await getCurrentProfile();

  if (!user) {
    redirect("/login");
  }

  if (profile) {
    redirect("/login");
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-12 text-slate-100">
      <div className="mx-auto flex min-h-[calc(100vh-6rem)] w-full max-w-xl items-center">
        <section className="w-full rounded-3xl border border-slate-800 bg-slate-900/80 p-8">
          <p className="text-sm font-medium uppercase tracking-[0.3em] text-sky-300">
            Onboarding
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">
            Finish setting up your profile
          </h1>
          <p className="mt-4 text-sm leading-7 text-slate-300">
            Your account is authenticated with Discord. Next we will collect
            your unique username and create your app profile.
          </p>
          <div className="mt-6">
            <form action={signOut}>
              <button
                type="submit"
                className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-200"
              >
                Sign out
              </button>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}
