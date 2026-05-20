"use server";

import {
  closeLFGPost as closeLFGPostAction,
  createLFGPost as createLFGPostAction,
} from "@/features/lfg/actions";

export async function createLFGPost(formData: FormData) {
  return createLFGPostAction(formData);
}

export async function closeLFGPost(formData: FormData) {
  return closeLFGPostAction(formData);
}
