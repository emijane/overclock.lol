"use server";

import { signOut as sharedSignOut } from "@/features/auth/actions";

export async function signOut() {
  return sharedSignOut();
}
