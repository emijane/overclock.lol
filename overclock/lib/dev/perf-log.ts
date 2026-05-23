// Temporary performance instrumentation for stacks route audit.
// Enabled automatically in development unless STACKS_PERF=0 is set.
// Remove this file and all stacksPerfLog() call sites when the audit is complete.
const ENABLED = process.env.NODE_ENV !== "production" && process.env.STACKS_PERF !== "0";

export function stacksPerfStart(): number {
  return Date.now();
}

export function stacksPerfLog(label: string, start: number, rows?: number): void {
  if (!ENABLED) return;
  const ms = Date.now() - start;
  const rowPart = rows !== undefined ? ` rows=${rows}` : "";
  console.log(`[perf:stacks] ${label} +${ms}ms${rowPart}`);
}
