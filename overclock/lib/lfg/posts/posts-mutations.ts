import { createClient } from "@/lib/supabase/server";

import { normalizeLFGCloseResult } from "./post-normalization";
import { type CreateLFGPostInput, tryCreateLFGPostAtomicVariants } from "./posts-rpc";

export async function createLFGPostAtomically(input: CreateLFGPostInput) {
  const supabase = await createClient();
  return tryCreateLFGPostAtomicVariants(supabase, input);
}

export async function closeOwnedActiveLFGPost(input: {
  postId: string;
  profileId: string;
}) {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("close_owned_lfg_post", {
    p_post_id: input.postId,
  });

  if (error) {
    throw error;
  }

  return normalizeLFGCloseResult(data);
}
