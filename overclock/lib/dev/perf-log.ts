// Temporary performance instrumentation for stacks route audit.
// Enable by setting STACKS_PERF=1 in your .env.local.
// Remove this file and all stacksPerfLog() call sites when the audit is complete.
const ENABLED = process.env.STACKS_PERF === '1';

export function stacksPerfLog(label: string, start: number, rows?: number): void {
  if (!ENABLED) return;
  const ms = Date.now() - start;
  const rowPart = rows !== undefined ? ` rows=${rows}` : '';
  console.log(`[perf:stacks] ${label} +${ms}ms${rowPart}`);
}
