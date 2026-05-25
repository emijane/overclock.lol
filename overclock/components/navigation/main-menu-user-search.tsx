"use client";

import Link from "next/link";
import { SearchIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import { ProfileResultRow } from "@/components/profile/profile-result-row";
import {
  normalizeProfileSearchQuery,
  PROFILE_SEARCH_QUERY_MAX_LENGTH,
  PROFILE_SEARCH_DROPDOWN_LIMIT,
  type PublicProfileSearchResult,
} from "@/lib/profiles/profile-search-shared";

const SEARCH_DEBOUNCE_MS = 220;

export function MainMenuUserSearch() {
  const pathname = usePathname();
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PublicProfileSearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(-1);

  useEffect(() => {
    setIsOpen(false);
    setActiveIndex(-1);
  }, [pathname]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
        setActiveIndex(-1);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
        setActiveIndex(-1);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleEscape);
    };
  }, []);

  useEffect(() => {
    const normalizedQuery = normalizeProfileSearchQuery(query);

    if (!normalizedQuery) {
      setResults([]);
      setErrorMessage(null);
      setIsLoading(false);
      setIsOpen(false);
      setActiveIndex(-1);
      return;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(async () => {
      setIsLoading(true);
      setErrorMessage(null);
      setIsOpen(true);

      try {
        const response = await fetch(`/api/users/search?q=${encodeURIComponent(normalizedQuery)}`, {
          method: "GET",
          signal: controller.signal,
        });
        const payload = (await response.json()) as {
          error?: string;
          results?: PublicProfileSearchResult[];
        };

        if (!response.ok) {
          setResults([]);
          setActiveIndex(-1);
          setErrorMessage(payload.error ?? "Unable to search right now.");
          return;
        }

        const nextResults = payload.results ?? [];
        setResults(nextResults);
        setActiveIndex(nextResults.length > 0 ? 0 : -1);
      } catch (error) {
        if ((error as Error).name === "AbortError") {
          return;
        }

        setResults([]);
        setActiveIndex(-1);
        setErrorMessage("Unable to search right now.");
      } finally {
        setIsLoading(false);
      }
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [query]);

  function handleOpenProfile(username: string) {
    setIsOpen(false);
    setActiveIndex(-1);
    router.push(`/u/${username}`);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (!isOpen || results.length === 0) {
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      const cap = Math.min(results.length, PROFILE_SEARCH_DROPDOWN_LIMIT);
      setActiveIndex((currentIndex) =>
        currentIndex >= cap - 1 ? 0 : currentIndex + 1
      );
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      const cap = Math.min(results.length, PROFILE_SEARCH_DROPDOWN_LIMIT);
      setActiveIndex((currentIndex) =>
        currentIndex <= 0 ? cap - 1 : currentIndex - 1
      );
      return;
    }

    if (event.key === "Enter" && activeIndex >= 0) {
      event.preventDefault();
      handleOpenProfile(results[activeIndex].username);
    }
  }

  const showDropdown = isOpen && (isLoading || errorMessage || results.length > 0 || query.trim());

  return (
    <div ref={containerRef} className="relative hidden shrink-0 md:block">
      <div className="flex h-9 w-48 items-center gap-2 rounded-[12px] border border-white/[0.06] bg-white/[0.025] px-3 text-zinc-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)] transition hover:border-white/[0.1] hover:bg-white/[0.035] focus-within:border-white/[0.12] focus-within:bg-white/[0.04] sm:w-52 lg:w-56 xl:w-60">
        <SearchIcon className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
        <input
          type="search"
          value={query}
          onChange={(event) =>
            setQuery(event.target.value.slice(0, PROFILE_SEARCH_QUERY_MAX_LENGTH))
          }
          onFocus={() => {
            if (normalizeProfileSearchQuery(query)) {
              setIsOpen(true);
            }
          }}
          onKeyDown={handleKeyDown}
          placeholder="SEARCH PLAYERS"
          autoComplete="off"
          spellCheck={false}
          className="oc-profile-meta h-6 min-w-0 flex-1 bg-transparent text-[10px] font-medium uppercase tracking-[0.14em] text-zinc-100 outline-none placeholder:text-zinc-400"
          aria-label="Search players by username or display name"
        />
      </div>

      {showDropdown ? (
        <div className="absolute right-0 top-[calc(100%+0.55rem)] z-80 w-full overflow-hidden rounded-[16px] border border-white/[0.06] bg-[rgba(12,12,14,0.98)] shadow-[0_18px_44px_rgba(0,0,0,0.32)] backdrop-blur-md">
          {isLoading ? (
            <div className="oc-profile-meta px-4 py-3 text-sm">Searching...</div>
          ) : errorMessage ? (
            <div className="oc-profile-meta px-4 py-3 text-sm text-rose-300">{errorMessage}</div>
          ) : results.length === 0 ? (
            <div className="oc-profile-meta px-4 py-3 text-sm">No players found.</div>
          ) : (
            <ul>
              {results.slice(0, PROFILE_SEARCH_DROPDOWN_LIMIT).map((result, index) => {
                const href = `/u/${result.username}`;
                const isActive = index === activeIndex;

                return (
                  <li
                    key={result.username}
                    className="border-b border-white/[0.05]"
                  >
                    <Link
                      href={href}
                      onClick={() => {
                        setIsOpen(false);
                        setActiveIndex(-1);
                      }}
                      onMouseEnter={() => setActiveIndex(index)}
                      className={`flex items-center gap-3 px-4 py-3 transition ${
                        isActive ? "bg-white/[0.05]" : "hover:bg-white/[0.03]"
                      }`}
                    >
                      <ProfileResultRow
                        avatarUrl={result.avatarUrl}
                        displayName={result.displayName}
                        username={result.username}
                      />
                    </Link>
                  </li>
                );
              })}
              <li>
                <Link
                  href={`/search/users?q=${encodeURIComponent(normalizeProfileSearchQuery(query))}`}
                  onClick={() => {
                    setIsOpen(false);
                    setActiveIndex(-1);
                  }}
                  className="oc-profile-display flex items-center px-4 py-3 text-[13px] text-zinc-400 transition hover:bg-white/[0.03] hover:text-zinc-100"
                >
                  View all results for &ldquo;{normalizeProfileSearchQuery(query)}&rdquo;
                </Link>
              </li>
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
