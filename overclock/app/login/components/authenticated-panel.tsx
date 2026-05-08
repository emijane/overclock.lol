import Link from "next/link";

type AuthenticatedPanelProps = {
  email?: string;
};

export function AuthenticatedPanel({ email }: AuthenticatedPanelProps) {
  return (
    <div className="grid gap-3 px-5 py-4 sm:px-6">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-300">
          Signed in
        </p>
        <h2 className="mt-2 text-xl font-semibold tracking-[-0.04em] text-zinc-50">
          Welcome back
        </h2>
        <p className="mt-2 text-sm leading-6 text-zinc-400">
          Signed in as{" "}
          <span className="font-medium text-zinc-100">
            {email ?? "an authenticated user"}
          </span>.
        </p>
      </div>

      <div className="rounded-[18px] border border-white/8 bg-white/4 px-4 py-3 text-sm text-zinc-300">
        Your account is ready. Open your profile or jump back into discovery.
      </div>

      <div className="flex flex-wrap gap-2">
        <Link
          href="/account"
          className="inline-flex h-8 items-center rounded-full border border-white/10 bg-white/5 px-3 text-xs font-medium text-zinc-100 transition hover:border-white/20 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#05070b]"
        >
          Account
        </Link>
        <Link
          href="/duos"
          className="inline-flex h-8 items-center rounded-full border border-white/10 bg-white/5 px-3 text-xs font-medium text-zinc-100 transition hover:border-white/20 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#05070b]"
        >
          Browse duos
        </Link>
      </div>
    </div>
  );
}
