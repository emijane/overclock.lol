"use client";

import Link from "next/link";
import {
  LogOutIcon,
  MessageSquareIcon,
  SettingsIcon,
  TrophyIcon,
  UserIcon,
  UsersIcon,
} from "lucide-react";
import { useTransition } from "react";

import { signOut } from "@/features/auth/actions";
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
          className="oc-profile-icon-button h-9 w-9 cursor-pointer rounded-[10px] border border-white/[0.06] bg-white/[0.03] p-0 text-zinc-300 transition hover:border-white/[0.10] hover:bg-white/[0.05] hover:text-zinc-100"
        >
          <Avatar className="h-8 w-8">
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
        className="w-56 rounded-[16px] border border-white/[0.06] !bg-[rgba(12,12,14,0.98)] text-zinc-100 shadow-[0_18px_44px_rgba(0,0,0,0.35)] backdrop-blur-md"
      >
        <DropdownMenuLabel className="px-3 py-2">
          <span className="oc-profile-display block text-sm font-semibold text-zinc-100">
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
            <Link href="/connections">
              <UsersIcon />
              Connections
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
