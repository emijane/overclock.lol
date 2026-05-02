"use client";

import Link from "next/link";
import {
  LogOutIcon,
  MessageSquareIcon,
  SettingsIcon,
  TrophyIcon,
  UserIcon,
} from "lucide-react";
import { useTransition } from "react";

import { signOut } from "@/app/auth/actions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type UserMenuProps = {
  avatarFallback: string;
  avatarUrl: string | null;
  profileHref: string;
  visibleName: string;
};

export function UserMenu({
  avatarFallback,
  avatarUrl,
  profileHref,
  visibleName,
}: UserMenuProps) {
  const [isPending, startTransition] = useTransition();

  function handleSignOut() {
    startTransition(async () => {
      await signOut();
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full cursor-pointer"
        >
          <Avatar className="h-9 w-9">
            {avatarUrl ? (
              <AvatarImage src={avatarUrl} alt={`${visibleName} avatar`} />
            ) : null}
            <AvatarFallback className="bg-zinc-800 text-zinc-100">
              {avatarFallback}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-56 border border-white/10 !bg-black text-zinc-100"
      >
        <DropdownMenuLabel className="px-3 py-2">
          <span className="block text-sm font-semibold text-zinc-100">
            @{visibleName}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-zinc-800" />
        <DropdownMenuGroup>
          <DropdownMenuItem
            asChild
            className="text-zinc-300 focus:bg-[#080b10] focus:text-zinc-100"
          >
            <Link href={profileHref}>
              <UserIcon />
              Profile
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem
            asChild
            className="text-zinc-300 focus:bg-[#080b10] focus:text-zinc-100"
          >
            <Link href="/account/competitive">
              <TrophyIcon />
              Competitive Profile
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem
            asChild
            className="text-zinc-300 focus:bg-[#080b10] focus:text-zinc-100"
          >
            <Link href="/account/posts">
              <MessageSquareIcon />
              My Posts
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem
            asChild
            className="text-zinc-300 focus:bg-[#080b10] focus:text-zinc-100"
          >
            <Link href="/account">
              <SettingsIcon />
              Account
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator className="bg-zinc-800" />
        <DropdownMenuItem
          disabled={isPending}
          onSelect={(event) => {
            event.preventDefault();
            handleSignOut();
          }}
          className="text-amber-400 focus:bg-amber-950/30 focus:text-amber-300"
        >
          <LogOutIcon />
          {isPending ? "Signing out..." : "Sign out"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
