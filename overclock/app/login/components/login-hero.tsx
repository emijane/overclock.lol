export function LoginHero() {
  return (
    <section className="rounded-3xl border border-slate-800 bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.22),_transparent_35%),linear-gradient(135deg,_rgba(15,23,42,0.98),_rgba(2,6,23,0.96))] p-8 shadow-2xl shadow-sky-950/30">
      <p className="text-sm font-medium uppercase tracking-[0.35em] text-sky-300">
        Overclock Auth
      </p>
      <h1 className="mt-4 max-w-2xl text-4xl font-semibold tracking-tight text-white">
        Secure Supabase login, wired for Next.js server rendering.
      </h1>
      <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300">
        This starter keeps auth on the server, refreshes sessions through the
        Next.js proxy, and checks claims server-side before rendering protected
        UI.
      </p>
    </section>
  );
}
