"use server";

import {
  blockUser as blockUserMutation,
  unblockUser as unblockUserMutation,
} from "@/lib/blocks/user-blocks";

export async function blockUser(profileId: string) {
  return blockUserMutation(profileId);
}

export async function unblockUser(profileId: string) {
  return unblockUserMutation(profileId);
}
