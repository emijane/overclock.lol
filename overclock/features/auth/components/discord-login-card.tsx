"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { FaDiscord } from "react-icons/fa";

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
    <div className="oc-surface-panel overflow-hidden rounded-[22px] ring-1 ring-white/5">
      <div className="border-b border-white/6 px-6 py-5 sm:px-7 sm:py-5.5">
        <div className="min-w-0 text-center">
          <div className="mb-2 flex justify-center">
            <Image
              src="/branding/kitty-v2/kitty-v2-red-eye-cross-border.png"
              alt="Overclock logo"
              width={56}
              height={56}
              className="h-14 w-auto shrink-0"
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

      <div className="grid gap-3 px-6 py-5 sm:px-7 sm:py-5.5">
        <button
          type="button"
          onClick={handleDiscordLogin}
          disabled={isLoading}
          aria-disabled={isLoading}
          className="inline-flex h-11 items-center justify-center gap-2.5 rounded-[10px] border border-[#6c77f5]/30 bg-[var(--oc-color-discord)] px-5 text-sm font-semibold text-white transition hover:border-[#7d86f7]/40 hover:bg-[#6c77f5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6c77f5]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--oc-bg-deep)] disabled:cursor-wait disabled:border-white/8 disabled:bg-white/4 disabled:text-zinc-400"
        >
          <FaDiscord className="h-4.5 w-4.5 shrink-0" aria-hidden="true" />
          {isLoading ? "Redirecting..." : "Continue with Discord"}
        </button>

        <p className="text-center text-xs leading-5 text-zinc-500">
          Discord is currently the only sign-in method.
        </p>
        <p className="-mt-1 text-center text-xs leading-5 text-zinc-500">
          By continuing, you agree to the{" "}
          <Link
            href="/terms"
            className="text-zinc-300 transition hover:text-zinc-100"
          >
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link
            href="/privacy"
            className="text-zinc-300 transition hover:text-zinc-100"
          >
            Privacy Policy
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
