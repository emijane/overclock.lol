const SECURITY_DEFAULTS = [
  "Use the publishable key only in browser-safe code.",
  "Never expose the service role key to the client.",
  "Keep email confirmation enabled in Supabase Auth.",
  "Protect data with Row Level Security, not hidden UI alone.",
  "Verify auth on the server with claims before loading private data.",
  "Store profiles and app data in your own tables keyed by auth user id.",
];

export function SecurityChecklist() {
  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-8">
      <h2 className="text-2xl font-semibold text-white">
        Security defaults to keep
      </h2>
      <ul className="mt-5 space-y-3 text-sm leading-7 text-slate-300">
        {SECURITY_DEFAULTS.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
