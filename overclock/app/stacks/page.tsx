import { LFGPageShell } from "@/app/lfg/components/lfg-page-shell";

export default function StacksPage() {
  return (
    <LFGPageShell
      title="Stacks"
      description="Build a group for flexible sessions or full team queue."
      helperText="For groups of 3-5 players and flexible sessions."
      createPostTitle="Create Stack Post"
      filtersDescription="Filter by rank, role, region, and playstyle."
      emptyStateTitle="No stacks yet"
      emptyStateDescription="Create a post to start building a group."
    />
  );
}
