import { signUp } from "@/app/auth/actions";

export function SignUpForm() {
  return (
    <form
      action={signUp}
      className="grid gap-4 rounded-2xl border border-slate-800 bg-slate-950/70 p-5"
    >
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
  );
}
