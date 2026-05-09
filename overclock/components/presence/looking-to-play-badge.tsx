type LookingToPlayBadgeProps = {
  className?: string;
  children?: React.ReactNode;
  tone?: "accent" | "neutral";
};

export function LookingToPlayBadge({
  className = "",
  children = "Looking to play",
  tone = "accent",
}: LookingToPlayBadgeProps) {
  const palette =
    tone === "neutral"
      ? "border-white/10 bg-white/5 text-zinc-100"
      : "border-sky-400/20 bg-sky-400/10 text-sky-100";

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${palette} ${className}`.trim()}
    >
      {children}
    </span>
  );
}
