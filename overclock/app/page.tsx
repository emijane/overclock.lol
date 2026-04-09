import { signIn, signOut, signUp } from "@/app/auth/actions";
import { createClient } from "@/lib/supabase/server";

type HomeProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function pickValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function Home({ searchParams }: HomeProps) {
  const params = searchParams ? await searchParams : {};
  const message = pickValue(params.message);
  const messageType = pickValue(params.type);

  const supabase = await createClient();
  const {
    data: { claims },
  } = await supabase.auth.getClaims();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAuthenticated = Boolean(claims?.sub);

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-12 text-slate-100">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-10">
        <section className="rounded-3xl border border-slate-800 bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.22),_transparent_35%),linear-gradient(135deg,_rgba(15,23,42,0.98),_rgba(2,6,23,0.96))] p-8 shadow-2xl shadow-sky-950/30">
          <p className="text-sm font-medium uppercase tracking-[0.35em] text-sky-300">
            Overclock Auth
          </p>
          <h1 className="mt-4 max-w-2xl text-4xl font-semibold tracking-tight text-white">
            Secure Supabase login, wired for Next.js server rendering.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300">
            This starter keeps auth on the server, refreshes sessions through
            the Next.js proxy, and checks claims server-side before rendering
            protected UI.
          </p>
        </section>

        {message ? (
          <div
            className={`rounded-2xl border px-4 py-3 text-sm ${
              messageType === "success"
                ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-100"
                : "border-rose-400/40 bg-rose-400/10 text-rose-100"
            }`}
          >
            {message}
          </div>
        ) : null}

        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-8">
            <h2 className="text-2xl font-semibold text-white">
              Security defaults to keep
            </h2>
            <ul className="mt-5 space-y-3 text-sm leading-7 text-slate-300">
              <li>Use the publishable key only in browser-safe code.</li>
              <li>Never expose the service role key to the client.</li>
              <li>Keep email confirmation enabled in Supabase Auth.</li>
              <li>Protect data with Row Level Security, not hidden UI alone.</li>
              <li>Verify auth on the server with claims before loading private data.</li>
              <li>Store profiles and app data in your own tables keyed by auth user id.</li>
            </ul>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-8">
            {isAuthenticated ? (
              <div className="space-y-6">
                <div>
                  <p className="text-sm uppercase tracking-[0.3em] text-emerald-300">
                    Signed in
                  </p>
                  <h2 className="mt-3 text-2xl font-semibold text-white">
                    Welcome back
                  </h2>
                  <p className="mt-3 text-sm leading-7 text-slate-300">
                    You are authenticated as{" "}
                    <span className="font-medium text-white">
                      {user?.email ?? claims?.email ?? "an authenticated user"}
                    </span>
                    .
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-300">
                  Protected pages should do their own server-side claim check
                  before fetching user data.
                </div>

                <form action={signOut}>
                  <button
                    className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-200"
                    type="submit"
                  >
                    Sign out
                  </button>
                </form>
              </div>
            ) : (
              <div className="grid gap-6">
                <form action={signIn} className="grid gap-4">
                  <div>
                    <h2 className="text-2xl font-semibold text-white">Sign in</h2>
                    <p className="mt-2 text-sm text-slate-400">
                      Use server actions so credentials are handled on the server.
                    </p>
                  </div>

                  <label className="grid gap-2 text-sm text-slate-300">
                    Email
                    <input
                      required
                      name="email"
                      type="email"
                      autoComplete="email"
                      className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-sky-400"
                    />
                  </label>

                  <label className="grid gap-2 text-sm text-slate-300">
                    Password
                    <input
                      required
                      name="password"
                      type="password"
                      autoComplete="current-password"
                      className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-sky-400"
                    />
                  </label>

                  <button
                    className="rounded-full bg-sky-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-300"
                    type="submit"
                  >
                    Sign in
                  </button>
                </form>

                <form action={signUp} className="grid gap-4 rounded-2xl border border-slate-800 bg-slate-950/70 p-5">
                  <div>
                    <h3 className="text-lg font-semibold text-white">Create account</h3>
                    <p className="mt-2 text-sm text-slate-400">
                      New users will get a confirmation email before they can sign in.
                    </p>
                  </div>

                  <label className="grid gap-2 text-sm text-slate-300">
                    Email
                    <input
                      required
                      name="email"
                      type="email"
                      autoComplete="email"
                      className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-sky-400"
                    />
                  </label>

                  <label className="grid gap-2 text-sm text-slate-300">
                    Password
                    <input
                      required
                      name="password"
                      type="password"
                      minLength={12}
                      autoComplete="new-password"
                      className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-sky-400"
                    />
                  </label>

                  <button
                    className="rounded-full border border-slate-700 px-5 py-3 text-sm font-semibold text-white transition hover:border-sky-400 hover:text-sky-200"
                    type="submit"
                  >
                    Sign up
                  </button>
                </form>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
