"use client";

import { MoreHorizontalIcon } from "lucide-react";
import { useFormStatus } from "react-dom";

import { closeLFGPost } from "@/app/lfg/actions";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function ClosePostMenuItem() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="flex w-full items-center rounded-lg px-2 py-1.5 text-left text-sm text-amber-300 outline-none transition hover:bg-zinc-900 hover:text-amber-200 disabled:cursor-not-allowed disabled:text-zinc-500"
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
          className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/[0.025] text-zinc-400 transition hover:border-white/20 hover:bg-white/[0.045] hover:text-zinc-100"
        >
          <MoreHorizontalIcon className="h-4 w-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-40 border border-zinc-800 bg-zinc-950 text-zinc-100"
      >
        <DropdownMenuItem asChild className="p-0 focus:bg-transparent">
          <form action={closeLFGPost} className="w-full">
            <input type="hidden" name="post_id" value={postId} />
            <input type="hidden" name="return_path" value={returnPath} />
            <ClosePostMenuItem />
          </form>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
