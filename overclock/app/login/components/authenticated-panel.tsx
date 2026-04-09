type AuthenticatedPanelProps = {
  email?: string;
};

export function AuthenticatedPanel({ email }: AuthenticatedPanelProps) {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.3em] text-emerald-300">
          Signed in
        </p>
        <h2 className="mt-3 text-2xl font-semibold text-white">Welcome back</h2>
        <p className="mt-3 text-sm leading-7 text-slate-300">
          You are authenticated as{" "}
          <span className="font-medium text-white">
            {email ?? "an authenticated user"}
          </span>
          .
        </p>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-300">
        Protected pages should do their own server-side claim check before
        fetching user data.
      </div>
    </div>
  );
}
