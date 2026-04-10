import type * as React from "react";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  size?: "default" | "icon";
  variant?: "default" | "ghost";
};

export function Button({
  className = "",
  size = "default",
  variant = "default",
  ...props
}: ButtonProps) {
  const variantClass =
    variant === "ghost"
      ? "hover:bg-zinc-900 hover:text-white"
      : "bg-zinc-100 text-black hover:bg-white";
  const sizeClass =
    size === "icon" ? "h-10 w-10 p-0" : "h-10 px-4 py-2";

  return (
    <button
      className={`inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium text-zinc-200 outline-none transition focus-visible:ring-2 focus-visible:ring-zinc-500 disabled:pointer-events-none disabled:opacity-50 ${variantClass} ${sizeClass} ${className}`}
      {...props}
    />
  );
}
