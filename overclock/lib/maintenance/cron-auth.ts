import { headers } from "next/headers";

export async function isAuthorizedCronRequest() {
  const cronSecret = process.env.CRON_SECRET?.trim();

  if (!cronSecret) {
    return {
      authorized: false,
      reason: "Cron secret is not configured.",
      status: 500,
    } as const;
  }

  const headerStore = await headers();
  const authorization = headerStore.get("authorization");

  if (authorization !== `Bearer ${cronSecret}`) {
    return {
      authorized: false,
      reason: "Unauthorized cron request.",
      status: 401,
    } as const;
  }

  return {
    authorized: true,
  } as const;
}
