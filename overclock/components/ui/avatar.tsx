"use client";

import * as AvatarPrimitive from "@radix-ui/react-avatar";
import type * as React from "react";

export function Avatar({
  className = "",
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Root>) {
  return (
    <AvatarPrimitive.Root
      className={`relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full ${className}`}
      {...props}
    />
  );
}

export function AvatarImage({
  className = "",
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Image>) {
  return (
    <AvatarPrimitive.Image
      className={`aspect-square h-full w-full object-cover ${className}`}
      {...props}
    />
  );
}

export function AvatarFallback({
  className = "",
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Fallback>) {
  return (
    <AvatarPrimitive.Fallback
      className={`flex h-full w-full items-center justify-center rounded-full bg-zinc-900 text-sm font-semibold text-zinc-200 ${className}`}
      {...props}
    />
  );
}
