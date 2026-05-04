type LookingToPlayBadgeProps = {
  className?: string;
  children?: React.ReactNode;
};

export function LookingToPlayBadge({
  className = "",
  children = "Looking to play",
}: LookingToPlayBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full border border-sky-400/20 bg-sky-400/10 px-2 py-0.5 text-[10px] font-medium text-sky-100 ${className}`.trim()}
    >
      {children}
    </span>
  );
}
