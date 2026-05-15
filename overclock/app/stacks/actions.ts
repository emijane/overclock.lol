"use server";
import {
  acceptStackJoinRequest as acceptStackJoinRequestImpl,
  declineStackJoinRequest as declineStackJoinRequestImpl,
  leaveStack as leaveStackImpl,
  removeStackMember as removeStackMemberImpl,
  sendStackJoinRequest as sendStackJoinRequestImpl,
} from "@/features/lfg/stack-actions";

export async function sendStackJoinRequest(formData: FormData) {
  return sendStackJoinRequestImpl(formData);
}

export async function acceptStackJoinRequest(formData: FormData) {
  return acceptStackJoinRequestImpl(formData);
}

export async function leaveStack(formData: FormData) {
  return leaveStackImpl(formData);
}

export async function removeStackMember(formData: FormData) {
  return removeStackMemberImpl(formData);
}

export async function declineStackJoinRequest(formData: FormData) {
  return declineStackJoinRequestImpl(formData);
}
