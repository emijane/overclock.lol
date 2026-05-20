import type { LFGType } from "@/lib/lfg/lfg-post-types";

function isLFGType(value: string): value is LFGType {
  return value === "duos" || value === "stacks" || value === "teams" || value === "scrims";
}

export function getActionErrorText(error: unknown) {
  if (!error || typeof error !== "object") {
    return "";
  }

  const candidate = error as Record<string, unknown>;

  return [
    typeof candidate.code === "string" ? candidate.code : "",
    typeof candidate.message === "string" ? candidate.message : "",
    typeof candidate.details === "string" ? candidate.details : "",
    typeof candidate.hint === "string" ? candidate.hint : "",
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

export function getPublicStackDebugMessage(error: unknown) {
  if (!error || typeof error !== "object") {
    return null;
  }

  const candidate = error as Record<string, unknown>;
  const code = typeof candidate.code === "string" ? candidate.code : null;
  const message =
    typeof candidate.message === "string" ? candidate.message.trim() : null;

  if (!code && !message) {
    return null;
  }

  const compactMessage = message
    ? message.replace(/\s+/g, " ").slice(0, 120)
    : "Unknown stack create error";

  return `Stack debug: ${code ?? "no-code"} ${compactMessage}`;
}

export function getLFGRedirectPath(lfgType: string) {
  return lfgType === "duos" ? "/duos" : `/${lfgType}`;
}

export function getCreateLFGPostErrorMessage(errorCode: string | null) {
  if (errorCode === "duplicate_active_post") {
    return "You already have an active post in this section with this title.";
  }

  if (errorCode === "active_slot_limit") {
    return "You already have the maximum number of active posts for this role.";
  }

  if (errorCode === "create_rate_limit") {
    return "You've created too many posts recently. Try again later.";
  }

  if (errorCode === "already_in_active_stack") {
    return "You already belong to an active stack. Leave or close it before creating another.";
  }

  return "Unable to create your post right now.";
}

export function shouldRedirectToLoginForCreateError(errorCode: string | null) {
  return errorCode === "unauthenticated" || errorCode === "forbidden";
}

export function shouldShowStackCreateDebugMessage(
  lfgType: string,
  error: unknown
) {
  const errorText = getActionErrorText(error);

  return (
    lfgType === "stacks" &&
    (errorText.includes("create_lfg_post_atomic") ||
      errorText.includes("stack_members") ||
      errorText.includes("expire_stack_posts"))
  );
}

export function resolveCloseLFGReturnPath(input: {
  fallbackPath: string;
  resultLfgType: string | null;
}) {
  const redirectPath =
    input.resultLfgType && isLFGType(input.resultLfgType)
      ? getLFGRedirectPath(input.resultLfgType)
      : input.fallbackPath;

  const returnPath =
    input.fallbackPath.startsWith("/u/") ||
    input.fallbackPath === "/lfg" ||
    input.fallbackPath.startsWith("/stacks/")
      ? input.fallbackPath
      : redirectPath;

  return {
    redirectPath,
    returnPath,
  };
}
