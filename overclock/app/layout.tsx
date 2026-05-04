import type { Metadata } from "next";
import { Geist } from "next/font/google";

import { GlobalAuthBar } from "@/app/components/global-auth-bar";
import { GlobalBackgroundShell } from "@/app/components/global-background-shell";
import { GlobalFooter } from "@/app/components/global-footer";
import { PresenceProvider } from "@/app/components/presence-provider";
import { getCurrentProfile } from "@/lib/profiles/get-current-profile";

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

export default async function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const { user, profile } = await getCurrentProfile();

    return (
        <html
            lang="en"
            suppressHydrationWarning
            className={`${geistSans.variable} h-full antialiased`}
        >
            <body
                suppressHydrationWarning
                className="min-h-screen flex flex-col bg-[#07080d] text-zinc-100"
            >
                <PresenceProvider
                    currentUserId={user?.id ?? null}
                    currentUsername={profile?.username ?? null}
                >
                    <GlobalBackgroundShell>
                        <GlobalAuthBar
                            profile={
                                profile
                                    ? {
                                          discord_avatar_url:
                                              profile.discord_avatar_url ?? null,
                                          display_name: profile.display_name ?? null,
                                          username: profile.username,
                                      }
                                    : null
                            }
                            userId={user?.id ?? null}
                        />
                        {children}
                        <GlobalFooter />
                    </GlobalBackgroundShell>
                </PresenceProvider>
            </body>
        </html>
    );
}
