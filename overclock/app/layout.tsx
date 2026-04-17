import type { Metadata } from "next";
import { Google_Sans_Flex } from "next/font/google";

import { GlobalAuthBar } from "@/app/components/global-auth-bar";

import "./globals.css";

const googleSansFlex = Google_Sans_Flex({
  variable: "--font-google-sans-flex",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "overclock.lol",
  description:
    "Profile-first Overwatch player pages with Discord sign-in, rank details, socials, and hero pools.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${googleSansFlex.variable} h-full antialiased`}
    >
      <body
        suppressHydrationWarning
        className="min-h-full flex flex-col bg-zinc-950 text-zinc-100"
      >
        <GlobalAuthBar />
        {children}
      </body>
    </html>
  );
}
