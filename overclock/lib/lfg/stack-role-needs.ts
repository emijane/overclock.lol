import type { CompetitiveRole } from "@/lib/competitive/competitive-profile-types";
import type { StackMember } from "@/lib/lfg/lfg-post-types";

const STACK_ROLE_QUOTA: Record<CompetitiveRole, number> = {
  tank: 1,
  dps: 2,
  support: 2,
};

/**
 * Computes remaining role slots needed for a 5v5 stack.
 * Accepted members (stackMembers) reduce the quota; pending/removed do not.
 * Returns a Map with only roles that still have open slots.
 */
export function computeStackRoleNeeds(
  stackMembers: StackMember[]
): Map<CompetitiveRole, number> {
  const remaining = new Map<CompetitiveRole, number>([
    ["tank", STACK_ROLE_QUOTA.tank],
    ["dps", STACK_ROLE_QUOTA.dps],
    ["support", STACK_ROLE_QUOTA.support],
  ]);

  for (const member of stackMembers) {
    const current = remaining.get(member.role) ?? 0;
    if (current > 0) {
      remaining.set(member.role, current - 1);
    }
  }

  for (const [role, count] of remaining) {
    if (count === 0) {
      remaining.delete(role);
    }
  }

  return remaining;
}
