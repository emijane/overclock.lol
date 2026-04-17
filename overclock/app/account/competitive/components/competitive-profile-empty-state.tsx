type CompetitiveProfileEmptyStateProps = {
  configuredRoleCount: number;
};

export function CompetitiveProfileEmptyState({
  configuredRoleCount,
}: CompetitiveProfileEmptyStateProps) {
  return (
    <section className="rounded-[28px] border border-zinc-800 bg-zinc-900 p-5 sm:p-6">
      <div className="rounded-[22px] border border-dashed border-zinc-800 bg-zinc-950/60 px-5 py-10 text-center">
        <p className="text-sm font-medium text-zinc-200">
          Competitive Profile is empty for now.
        </p>
        {configuredRoleCount > 0 ? (
          <p className="mt-2 text-sm text-zinc-500">
            {configuredRoleCount} role
            {configuredRoleCount === 1 ? "" : "s"} loaded.
          </p>
        ) : null}
      </div>
    </section>
  );
}
