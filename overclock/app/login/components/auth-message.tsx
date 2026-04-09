type AuthMessageProps = {
  message?: string;
  type?: string;
};

export function AuthMessage({ message, type }: AuthMessageProps) {
  if (!message) {
    return null;
  }

  return (
    <div
      className={`rounded-2xl border px-4 py-3 text-sm ${
        type === "success"
          ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-100"
          : "border-rose-400/40 bg-rose-400/10 text-rose-100"
      }`}
    >
      {message}
    </div>
  );
}
