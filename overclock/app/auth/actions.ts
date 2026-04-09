"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

function messageRedirect(message: string, type: "error" | "success" = "error") {
  const params = new URLSearchParams({ type, message });
  redirect(`/?${params.toString()}`);
}

export async function signUp(formData: FormData) {
  const email = formData.get("email")?.toString().trim();
  const password = formData.get("password")?.toString();

  if (!email || !password) {
    messageRedirect("Email and password are required.");
  }

  if (password.length < 12) {
    messageRedirect("Use a password with at least 12 characters.");
  }

  const supabase = await createClient();
  const headerStore = await headers();
  const origin = headerStore.get("origin") ?? "http://localhost:3000";

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/confirm`,
    },
  });

  if (error) {
    messageRedirect(error.message);
  }

  messageRedirect(
    "Check your email for the confirmation link before signing in.",
    "success"
  );
}

export async function signIn(formData: FormData) {
  const email = formData.get("email")?.toString().trim();
  const password = formData.get("password")?.toString();

  if (!email || !password) {
    messageRedirect("Email and password are required.");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    messageRedirect(error.message);
  }

  redirect("/");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
