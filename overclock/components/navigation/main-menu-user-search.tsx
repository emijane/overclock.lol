"use client";

import Link from "next/link";
import { SearchIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  normalizeProfileSearchQuery,
  PROFILE_SEARCH_QUERY_MAX_LENGTH,
  type PublicProfileSearchResult,
} from "@/lib/profiles/profile-search-shared";

const SEARCH_DEBOUNCE_MS = 220;

function getAvatarFallback(
  displayName: string | null,
  username: string | null | undefined
) {
  const source = displayName ?? username ?? "P";
  return source.slice(0, 1).toUpperCase();
}

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
      setActiveIndex((currentIndex) =>
        currentIndex >= results.length - 1 ? 0 : currentIndex + 1
      );
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((currentIndex) =>
        currentIndex <= 0 ? results.length - 1 : currentIndex - 1
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
    <div ref={containerRef} className="relative hidden md:block">
      <div className="flex h-9 w-56 items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 text-zinc-300 transition hover:border-white/16 focus-within:border-white/18 sm:w-60 lg:w-64">
        <SearchIcon className="h-3.5 w-3.5 shrink-0 text-zinc-500" />
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
          placeholder="Search players"
          autoComplete="off"
          spellCheck={false}
          className="h-7 min-w-0 flex-1 bg-transparent text-sm text-zinc-100 outline-none placeholder:text-zinc-500"
          aria-label="Search players by username or display name"
        />
      </div>

      {showDropdown ? (
        <div className="absolute right-0 top-[calc(100%+0.5rem)] z-[80] w-full overflow-hidden rounded-[22px] border border-white/8 bg-[#05070b] shadow-[0_24px_70px_rgba(0,0,0,0.28),inset_0_1px_0_rgba(255,255,255,0.04)]">
          {isLoading ? (
            <div className="px-4 py-3 text-sm text-zinc-500">Searching...</div>
          ) : errorMessage ? (
            <div className="px-4 py-3 text-sm text-rose-300">{errorMessage}</div>
          ) : results.length === 0 ? (
            <div className="px-4 py-3 text-sm text-zinc-500">No players found.</div>
          ) : (
            <ul>
              {results.map((result, index) => {
                const href = `/u/${result.username}`;
                const isActive = index === activeIndex;

                return (
                  <li
                    key={result.username}
                    className={index < results.length - 1 ? "border-b border-white/6" : ""}
                  >
                    <Link
                      href={href}
                      onClick={() => {
                        setIsOpen(false);
                        setActiveIndex(-1);
                      }}
                      onMouseEnter={() => setActiveIndex(index)}
                      className={`flex items-center gap-3 px-4 py-3 transition ${
                        isActive ? "bg-white/[0.04]" : "hover:bg-white/[0.025]"
                      }`}
                    >
                      <Avatar className="h-8 w-8 shrink-0 rounded-full">
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
                        <p className="truncate text-[13px] font-semibold text-zinc-100">
                          {result.displayName ?? result.username}
                        </p>
                        <p className="truncate text-[11px] text-zinc-500">
                          @{result.username}
                        </p>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
