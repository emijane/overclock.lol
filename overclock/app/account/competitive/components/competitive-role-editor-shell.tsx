import { COMPETITIVE_ROLE_LABELS } from "@/lib/competitive/competitive-role-labels";
import type { CompetitiveRole } from "@/lib/competitive/competitive-profile-types";

type CompetitiveRoleEditorShellProps = {
  onCancel: () => void;
  role: CompetitiveRole;
};

export function CompetitiveRoleEditorShell({
  onCancel,
  role,
}: CompetitiveRoleEditorShellProps) {
  return (
    <section className="rounded-[28px] border border-zinc-800 bg-zinc-900 p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-zinc-500">
            Role setup
          </p>
          <h2 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-zinc-50">
            {COMPETITIVE_ROLE_LABELS[role]}
          </h2>
        </div>

        <button
          type="button"
          onClick={onCancel}
          className="rounded-full border border-zinc-700 px-4 py-2 text-sm font-semibold text-zinc-300 transition hover:border-zinc-600 hover:bg-zinc-950 hover:text-zinc-50"
        >
          Cancel
        </button>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-[22px] border border-dashed border-zinc-800 bg-zinc-950/60 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-600">
            Rank
          </p>
          <p className="mt-2 text-sm font-medium text-zinc-300">Coming next</p>
        </div>

        <div className="rounded-[22px] border border-dashed border-zinc-800 bg-zinc-950/60 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-600">
            Hero pool
          </p>
          <p className="mt-2 text-sm font-medium text-zinc-300">Coming next</p>
        </div>
      </div>
    </section>
  );
}
