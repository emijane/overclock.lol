import { NextResponse } from "next/server";

import { runRetentionCleanupJobs } from "@/lib/maintenance/cleanup-jobs";
import { isAuthorizedCronRequest } from "@/lib/maintenance/cron-auth";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET() {
  const authorization = await isAuthorizedCronRequest();

  if (!authorization.authorized) {
    return NextResponse.json(
      {
        error: authorization.reason,
      },
      { status: authorization.status }
    );
  }

  try {
    const result = await runRetentionCleanupJobs();
    return NextResponse.json({
      ok: true,
      result,
    });
  } catch (error) {
    console.error("Retention cleanup cron failed", { error });

    return NextResponse.json(
      {
        error: "Retention cleanup failed.",
      },
      { status: 500 }
    );
  }
}
