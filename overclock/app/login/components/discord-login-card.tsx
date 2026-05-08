"use client";

import Image from "next/image";
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
    <div className="overflow-hidden rounded-[22px] border border-white/8 bg-[#05070b] shadow-[0_24px_70px_rgba(0,0,0,0.24),inset_0_1px_0_rgba(255,255,255,0.04)] ring-1 ring-white/5">
      <div className="border-b border-white/6 px-5 py-4 sm:px-6">
        <div className="min-w-0 text-center">
          <div className="mb-3 flex justify-center">
            <Image
              src="/branding/kitty-v1/kitty-v1-white-cross-border.png"
              alt="Overclock logo"
              width={56}
              height={56}
              className="h-14 w-14 shrink-0"
              priority
            />
          </div>
          <h1 className="text-3xl font-semibold tracking-[-0.07em] text-zinc-50 sm:text-4xl">
            Sign in to overclock.lol
          </h1>
          <p className="mt-2 text-sm leading-6 text-zinc-400">
            Access your profile and LFG activity.
          </p>
        </div>
      </div>

      <div className="grid gap-3 px-5 py-4 sm:px-6">
        <button
          type="button"
          onClick={handleDiscordLogin}
          disabled={isLoading}
          aria-disabled={isLoading}
          className="inline-flex h-10 items-center justify-center gap-2.5 rounded-full border border-[#6c77f5]/30 bg-[#5865F2] px-5 text-sm font-semibold text-white transition hover:border-[#7d86f7]/40 hover:bg-[#6c77f5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6c77f5]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#05070b] disabled:cursor-wait disabled:border-white/8 disabled:bg-white/4 disabled:text-zinc-400"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="h-4.5 w-4.5 shrink-0"
            fill="currentColor"
          >
            <path d="M20.317 4.369A19.791 19.791 0 0 0 15.885 3c-.191.328-.403.769-.554 1.116a18.27 18.27 0 0 0-5.287 0A11.75 11.75 0 0 0 9.49 3a19.736 19.736 0 0 0-4.433 1.369C2.25 8.557 1.489 12.64 1.87 16.666a19.9 19.9 0 0 0 5.993 3.03 14.31 14.31 0 0 0 1.284-2.111 12.945 12.945 0 0 1-2.024-.977c.17-.124.336-.253.496-.386 3.905 1.833 8.142 1.833 12 0 .162.133.327.262.496.386-.646.385-1.323.713-2.024.977.37.765.8 1.468 1.284 2.111a19.87 19.87 0 0 0 5.993-3.03c.456-4.664-.777-8.71-3.051-12.297ZM9.309 14.717c-1.183 0-2.157-1.085-2.157-2.419 0-1.334.955-2.42 2.157-2.42 1.211 0 2.176 1.095 2.157 2.42 0 1.334-.955 2.419-2.157 2.419Zm5.382 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.334.955-2.42 2.157-2.42 1.211 0 2.176 1.095 2.157 2.42 0 1.334-.946 2.419-2.157 2.419Z" />
          </svg>
          {isLoading ? "Redirecting..." : "Continue with Discord"}
        </button>

        <p className="text-xs leading-5 text-zinc-500">
          Discord is currently the only sign-in method.
        </p>
      </div>
    </div>
  );
}
