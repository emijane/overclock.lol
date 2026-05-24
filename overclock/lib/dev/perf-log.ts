// Temporary performance instrumentation for route and action audits.
// Enabled automatically in development unless an audit flag is explicitly set to 0.
// Remove this file and its call sites when the audits are complete.
const ENABLED =
  process.env.NODE_ENV !== "production" &&
  process.env.STACKS_PERF !== "0" &&
  process.env.LFG_PERF !== "0" &&
  process.env.MATCHES_PERF !== "0" &&
  process.env.IDENTITY_PERF !== "0" &&
  process.env.NOTIFICATIONS_PERF !== "0";

export function stacksPerfStart(): number {
  return Date.now();
}

function perfLog(scope: string, label: string, start: number, rows?: number): void {
  if (!ENABLED) return;
  const ms = Date.now() - start;
  const rowPart = rows !== undefined ? ` rows=${rows}` : "";
  console.log(`[perf:${scope}] ${label} +${ms}ms${rowPart}`);
}

export function stacksPerfLog(label: string, start: number, rows?: number): void {
  perfLog("stacks", label, start, rows);
}

export function duosPerfLog(label: string, start: number, rows?: number): void {
  perfLog("duos", label, start, rows);
}

export function identityPerfLog(label: string, start: number, rows?: number): void {
  perfLog("identity", label, start, rows);
}

export function matchesPerfLog(label: string, start: number, rows?: number): void {
  perfLog("matches", label, start, rows);
}

export function notificationsPerfLog(
  label: string,
  start: number,
  rows?: number
): void {
  perfLog("notifications", label, start, rows);
}
