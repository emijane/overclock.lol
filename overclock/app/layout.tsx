import type { Metadata } from "next";
import { Geist } from "next/font/google";

import { GlobalAuthBar } from "@/app/components/global-auth-bar";
import { GlobalBackgroundShell } from "@/app/components/global-background-shell";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
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
            className={`${geistSans.variable} h-full antialiased`}
        >
            <body
                suppressHydrationWarning
                className="min-h-full flex flex-col bg-[#07080d] text-zinc-100"
            >
                <GlobalBackgroundShell>
                    <GlobalAuthBar />
                    {children}
                </GlobalBackgroundShell>
            </body>
        </html>
    );
}
