"use client";

import Link from "next/link";
import { LogOutIcon, SettingsIcon, UserIcon } from "lucide-react";
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
          className="rounded-full border border-[#546174] bg-[#212833] text-[#f7fafc] transition hover:bg-[#28313d]"
        >
          <Avatar className="h-9 w-9 border border-[#313948]">
            {avatarUrl ? (
              <AvatarImage src={avatarUrl} alt={`${visibleName} avatar`} />
            ) : null}
            <AvatarFallback className="bg-[#2a313d] text-[#f5f7fa]">
              {avatarFallback}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-56 border border-[#3b4657] bg-[#1a1f27] text-[#eef2f7]"
      >
        <DropdownMenuLabel className="px-3 py-2">
          <span className="block text-sm font-semibold text-[#f7fafc]">
            @{visibleName}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-[#313948]" />
        <DropdownMenuGroup>
          <DropdownMenuItem
            asChild
            className="text-[#d8e0ea] focus:bg-[#232a34] focus:text-[#f7fafc]"
          >
            <Link href={profileHref}>
              <UserIcon />
              Profile
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem
            asChild
            className="text-[#d8e0ea] focus:bg-[#232a34] focus:text-[#f7fafc]"
          >
            <Link href="/account">
              <SettingsIcon />
              Account
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator className="bg-[#313948]" />
        <DropdownMenuItem
          disabled={isPending}
          onSelect={(event) => {
            event.preventDefault();
            handleSignOut();
          }}
          className="text-[#f99e1a] focus:bg-[#232a34] focus:text-[#ffb347]"
        >
          <LogOutIcon />
          {isPending ? "Signing out..." : "Sign out"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
