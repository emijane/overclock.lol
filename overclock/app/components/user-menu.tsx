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
          className="rounded-full border border-[#d7dee8] bg-[#f7f9fc] text-[#111827] transition hover:bg-[#eef2f7]"
        >
          <Avatar className="h-9 w-9 border border-[#d7dee8]">
            {avatarUrl ? (
              <AvatarImage src={avatarUrl} alt={`${visibleName} avatar`} />
            ) : null}
            <AvatarFallback className="bg-[#eef2f7] text-[#111827]">
              {avatarFallback}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-56 border border-[#d7dee8] bg-[#ffffff] text-[#111827]"
      >
        <DropdownMenuLabel className="px-3 py-2">
          <span className="block text-sm font-semibold text-[#111827]">
            @{visibleName}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-[#e5e7eb]" />
        <DropdownMenuGroup>
          <DropdownMenuItem
            asChild
            className="text-[#4b5563] focus:bg-[#f8fafc] focus:text-[#111827]"
          >
            <Link href={profileHref}>
              <UserIcon />
              Profile
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem
            asChild
            className="text-[#4b5563] focus:bg-[#f8fafc] focus:text-[#111827]"
          >
            <Link href="/account">
              <SettingsIcon />
              Account
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator className="bg-[#e5e7eb]" />
        <DropdownMenuItem
          disabled={isPending}
          onSelect={(event) => {
            event.preventDefault();
            handleSignOut();
          }}
          className="text-[#c06a00] focus:bg-[#fff7ed] focus:text-[#9a3412]"
        >
          <LogOutIcon />
          {isPending ? "Signing out..." : "Sign out"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
