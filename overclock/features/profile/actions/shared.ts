"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export type AuthenticatedProfileContext = {
  supabase: Awaited<ReturnType<typeof createClient>>;
  userId: string;
  username: string;
};

export function accountRedirect(
  message: string,
  returnTo = "/account",
  type: "error" | "success" = "error"
): never {
  const params = new URLSearchParams({ type, message });
  redirect(`${returnTo}?${params.toString()}`);
}

export function optionalTrimmedString(value: FormDataEntryValue | null) {
  const parsed = value?.toString().trim() ?? "";
  return parsed.length > 0 ? parsed : null;
}

export function resolveReturnTo(formData: FormData) {
  const parsed = optionalTrimmedString(formData.get("return_to"));

  if (!parsed) {
    return "/account";
  }

  if (!parsed.startsWith("/") || parsed.startsWith("//")) {
    return "/account";
  }

  return parsed;
}

export function revalidateAccountProfile(username: string) {
  revalidatePath("/account");
  revalidatePath(`/u/${username}`);
}

export async function getAuthenticatedProfileContextOrNull() {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return null;
  }

  const { data: ownerProfile, error: profileError } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .single();

  if (profileError || !ownerProfile) {
    return null;
  }

  return {
    supabase,
    userId: user.id,
    username: ownerProfile.username,
  } satisfies AuthenticatedProfileContext;
}

export async function requireAuthenticatedProfileContext() {
  const context = await getAuthenticatedProfileContextOrNull();

  if (!context) {
    redirect("/login");
  }

  return context;
}
