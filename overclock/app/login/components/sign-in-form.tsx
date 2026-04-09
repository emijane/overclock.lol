import { signIn } from "@/app/auth/actions";

export function SignInForm() {
  return (
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
  );
}
