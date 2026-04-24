"use client";

import { MoreHorizontalIcon } from "lucide-react";
import { useFormStatus } from "react-dom";

import { closeLFGPost } from "@/app/lfg/actions";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function ClosePostMenuItem() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="flex w-full cursor-pointer items-center rounded-md px-2 py-1.5 text-left text-sm font-medium text-zinc-200 outline-none transition hover:text-zinc-50 disabled:cursor-not-allowed disabled:text-zinc-500"
    >
      {pending ? "Closing..." : "Close Post"}
    </button>
  );
}

type LFGPostActionsMenuProps = {
  postId: string;
  returnPath: string;
};

export function LFGPostActionsMenu({
  postId,
  returnPath,
}: LFGPostActionsMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Post actions"
          className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-full text-zinc-500 transition hover:text-zinc-100"
        >
          <MoreHorizontalIcon className="h-3.5 w-3.5" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-36 rounded-xl border border-white/10 bg-black p-1 text-zinc-100 shadow-[0_16px_40px_rgba(0,0,0,0.35)]"
      >
        <form action={closeLFGPost} className="w-full">
          <input type="hidden" name="post_id" value={postId} />
          <input type="hidden" name="return_path" value={returnPath} />
          <ClosePostMenuItem />
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
