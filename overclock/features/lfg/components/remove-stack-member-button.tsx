"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { XIcon } from "lucide-react";

import { removeStackMember } from "@/features/lfg/stack-actions";

type RemoveStackMemberButtonProps = {
  className?: string;
  label?: string;
  memberProfileId: string;
  postId: string;
};

export function RemoveStackMemberButton({
  className,
  label,
  memberProfileId,
  postId,
}: RemoveStackMemberButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <span className="oc-profile-meta inline-flex h-8 items-center rounded-[10px] border border-rose-500/20 bg-rose-500/6 px-3 text-[11px] font-medium text-rose-300">
        Failed
      </span>
    );
  }

  return (
    <button
      type="button"
      disabled={isPending}
      aria-label="Remove member"
      onClick={() =>
        startTransition(async () => {
          setFailed(false);
          const formData = new FormData();
          formData.set("post_id", postId);
          formData.set("member_profile_id", memberProfileId);
          const result = await removeStackMember(formData);

          if (result.success) {
            router.refresh();
          } else {
            setFailed(true);
          }
        })
      }
      className={
        className ??
        "absolute -right-1 -top-1 inline-flex h-3.5 w-3.5 items-center justify-center rounded-[10px] border border-white/10 bg-black/80 text-zinc-300 transition hover:text-white disabled:opacity-50"
      }
    >
      <XIcon className="h-2.5 w-2.5" />
      {label ? <span className="ml-1">{label}</span> : null}
    </button>
  );
}
