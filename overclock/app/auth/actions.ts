"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

function messageRedirect(
  message: string,
  type: "error" | "success" = "error"
): never {
  const params = new URLSearchParams({ type, message });
  redirect(`/?${params.toString()}`);
}

function requireFormString(value: FormDataEntryValue | null, fieldName: string): string {
  const parsed = value?.toString().trim();

  if (!parsed) {
    messageRedirect(`${fieldName} is required.`);
  }

  return parsed;
}

export async function signUp(formData: FormData) {
  const email = requireFormString(formData.get("email"), "Email");
  const password = requireFormString(formData.get("password"), "Password");

  if (password.length < 12) {
    messageRedirect("Use a password with at least 12 characters.");
  }

  const supabase = await createClient();
  const headerStore = await headers();
  const origin = headerStore.get("origin") ?? "http://localhost:3000";

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/confirm`,
    },
  });

  if (error) {
    messageRedirect(error.message);
  }

  if (data.session) {
    redirect("/login");
  }

  messageRedirect(
    "Check your email for the confirmation link before signing in.",
    "success"
  );
}

export async function signIn(formData: FormData) {
  const email = requireFormString(formData.get("email"), "Email");
  const password = requireFormString(formData.get("password"), "Password");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    messageRedirect(error.message);
  }

  redirect("/login");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
