"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { XIcon } from "lucide-react";

import { removeStackMember } from "@/app/stacks/actions";

type RemoveStackMemberButtonProps = {
  memberProfileId: string;
  postId: string;
};

export function RemoveStackMemberButton({
  memberProfileId,
  postId,
}: RemoveStackMemberButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      aria-label="Remove member"
      onClick={() =>
        startTransition(async () => {
          const formData = new FormData();
          formData.set("post_id", postId);
          formData.set("member_profile_id", memberProfileId);
          const result = await removeStackMember(formData);

          if (result.success) {
            router.refresh();
          }
        })
      }
      className="absolute -right-1 -top-1 inline-flex h-3.5 w-3.5 items-center justify-center rounded-full border border-white/10 bg-black/80 text-zinc-300 transition hover:text-white disabled:opacity-50"
    >
      <XIcon className="h-2.5 w-2.5" />
    </button>
  );
}
