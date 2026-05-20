import type { Metadata } from "next";
import { Geist, IBM_Plex_Mono, Inter_Tight } from "next/font/google";

import { GlobalBackgroundShell } from "@/components/app-shell/global-background-shell";
import { GlobalFooter } from "@/components/app-shell/global-footer";
import { GlobalAuthBarServer } from "@/components/navigation/global-auth-bar-server";
import { PresenceProvider } from "@/components/presence/presence-provider";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const interTight = Inter_Tight({
  variable: "--font-inter-tight",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
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
      className={`${geistSans.variable} ${ibmPlexMono.variable} ${interTight.variable} h-full antialiased`}
    >
      <body
        suppressHydrationWarning
        className="min-h-screen flex flex-col bg-[var(--oc-bg-base)] text-zinc-100"
      >
        <PresenceProvider>
          <GlobalBackgroundShell>
            <GlobalAuthBarServer />
            {children}
            <GlobalFooter />
          </GlobalBackgroundShell>
        </PresenceProvider>
      </body>
    </html>
  );
}
