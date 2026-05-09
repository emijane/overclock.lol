import type { Metadata } from "next";
import Link from "next/link";
import { SearchIcon } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { searchPublicProfiles } from "@/lib/profiles/public-profile-search";
import {
  normalizeProfileSearchQuery,
  PROFILE_SEARCH_QUERY_MAX_LENGTH,
  PROFILE_SEARCH_PAGE_RESULT_LIMIT,
} from "@/lib/profiles/profile-search-shared";

type Props = {
  searchParams: Promise<{ q?: string }>;
};

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const params = await searchParams;
  const query = normalizeProfileSearchQuery(params.q);
  return {
    title: query
      ? `Results for "${query}" | overclock.lol`
      : "Search players | overclock.lol",
  };
}

function getAvatarFallback(displayName: string | null, username: string) {
  return (displayName ?? username).slice(0, 1).toUpperCase();
}

export default async function SearchUsersPage({ searchParams }: Props) {
  const params = await searchParams;
  const rawQuery = params.q ?? "";
  const query = normalizeProfileSearchQuery(rawQuery);

  let results: Awaited<ReturnType<typeof searchPublicProfiles>> = [];
  let error: string | null = null;

  if (query) {
    try {
      results = await searchPublicProfiles(query, PROFILE_SEARCH_PAGE_RESULT_LIMIT);
    } catch {
      error = "Unable to search right now. Please try again.";
    }
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10 sm:px-6">
      <form action="/search/users" method="GET">
        <div className="flex h-11 items-center gap-2.5 rounded-full border border-white/10 bg-white/[0.03] px-4 text-zinc-300 transition focus-within:border-white/18 hover:border-white/16">
          <SearchIcon className="h-4 w-4 shrink-0 text-zinc-500" />
          <input
            type="search"
            name="q"
            defaultValue={rawQuery}
            placeholder="Search players"
            autoComplete="off"
            spellCheck={false}
            maxLength={PROFILE_SEARCH_QUERY_MAX_LENGTH}
            className="h-full min-w-0 flex-1 bg-transparent text-sm text-zinc-100 outline-none placeholder:text-zinc-500"
            aria-label="Search players by username or display name"
          />
        </div>
      </form>

      <div className="mt-6">
        {!query ? (
          <p className="text-sm text-zinc-500">Enter a username or display name to search.</p>
        ) : error ? (
          <p className="text-sm text-rose-300">{error}</p>
        ) : results.length === 0 ? (
          <p className="text-sm text-zinc-500">
            No players found for &ldquo;{query}&rdquo;.
          </p>
        ) : (
          <>
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-zinc-500">
              {results.length === PROFILE_SEARCH_PAGE_RESULT_LIMIT
                ? `${results.length}+ results`
                : `${results.length} result${results.length === 1 ? "" : "s"}`}
            </p>
            <ul className="rounded-[22px] border border-white/8 bg-[#05070b] shadow-[0_24px_70px_rgba(0,0,0,0.24),inset_0_1px_0_rgba(255,255,255,0.04)]">
              {results.map((result, index) => (
                <li
                  key={result.username}
                  className={index < results.length - 1 ? "border-b border-white/6" : ""}
                >
                  <Link
                    href={`/u/${result.username}`}
                    className="flex items-center gap-3 px-4 py-3 transition hover:bg-white/[0.025]"
                  >
                    <Avatar className="h-9 w-9 shrink-0 rounded-full">
                      {result.avatarUrl ? (
                        <AvatarImage
                          src={result.avatarUrl}
                          alt={`${result.displayName ?? result.username} avatar`}
                        />
                      ) : null}
                      <AvatarFallback className="bg-zinc-900 text-xs text-zinc-100">
                        {getAvatarFallback(result.displayName, result.username)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-zinc-100">
                        {result.displayName ?? result.username}
                      </p>
                      <p className="truncate text-[11px] text-zinc-500">
                        @{result.username}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
