"use client";

import { useState } from "react";

import { createClient } from "@/lib/supabase/client";

export function DiscordLoginCard() {
  const [isLoading, setIsLoading] = useState(false);

  // Starts the Supabase OAuth flow in the browser and sends the user through
  // Discord before returning to our auth callback route.
  async function handleDiscordLogin() {
    setIsLoading(true);

    const supabase = createClient();
    const redirectTo = `${window.location.origin}/auth/callback?next=/login`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "discord",
      options: {
        redirectTo,
      },
    });

    if (error) {
      setIsLoading(false);
      window.location.href = `/login?type=error&message=${encodeURIComponent(
        error.message
      )}`;
    }
  }

  return (
    <div className="grid gap-5 rounded-3xl border border-slate-800 bg-slate-900/80 p-8">
      <div>
        <p className="text-sm font-medium uppercase tracking-[0.3em] text-indigo-300">
          Discord Login
        </p>
        <h2 className="mt-3 text-2xl font-semibold text-white">
          Sign in with Discord
        </h2>
        <p className="mt-3 text-sm leading-7 text-slate-300">
          Discord is the only sign-in method for now. That keeps onboarding fast
          for an Overwatch LFG app, and we will wire the Supabase OAuth flow in
          next.
        </p>
      </div>

      <button
        type="button"
        onClick={handleDiscordLogin}
        disabled={isLoading}
        aria-disabled={isLoading}
        className="flex items-center justify-center gap-3 rounded-full bg-[#5865F2] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#6c77f5] disabled:cursor-wait disabled:opacity-80"
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="h-5 w-5"
          fill="currentColor"
        >
          <path d="M20.317 4.369A19.791 19.791 0 0 0 15.885 3c-.191.328-.403.769-.554 1.116a18.27 18.27 0 0 0-5.287 0A11.75 11.75 0 0 0 9.49 3a19.736 19.736 0 0 0-4.433 1.369C2.25 8.557 1.489 12.64 1.87 16.666a19.9 19.9 0 0 0 5.993 3.03 14.31 14.31 0 0 0 1.284-2.111 12.945 12.945 0 0 1-2.024-.977c.17-.124.336-.253.496-.386 3.905 1.833 8.142 1.833 12 0 .162.133.327.262.496.386-.646.385-1.323.713-2.024.977.37.765.8 1.468 1.284 2.111a19.87 19.87 0 0 0 5.993-3.03c.456-4.664-.777-8.71-3.051-12.297ZM9.309 14.717c-1.183 0-2.157-1.085-2.157-2.419 0-1.334.955-2.42 2.157-2.42 1.211 0 2.176 1.095 2.157 2.42 0 1.334-.955 2.419-2.157 2.419Zm5.382 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.334.955-2.42 2.157-2.42 1.211 0 2.176 1.095 2.157 2.42 0 1.334-.946 2.419-2.157 2.419Z" />
        </svg>
        {isLoading ? "Redirecting to Discord..." : "Continue with Discord"}
      </button>

      <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm leading-6 text-slate-400">
        Use your Discord account to sign in. After Discord approves the login,
        Supabase sends you back to this page in an authenticated state.
      </div>
    </div>
  );
}
