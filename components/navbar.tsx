"use client";

import { useSession, signOut } from "next-auth/react";
import { Bell, Search, ChevronDown, LogOut, User, Settings, LayoutDashboard, X } from "lucide-react";
import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { NotificationDropdown } from "./notifications/notification-dropdown";
import { globalSearch } from "@/actions/search";

export function Navbar() {
  const { data: session } = useSession();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Debounced search
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (query.trim().length < 2) {
      setSearchResults(null);
      setShowSearch(false);
      return;
    }

    setSearchLoading(true);
    setShowSearch(true);

    debounceRef.current = setTimeout(async () => {
      try {
        const results = await globalSearch(query);
        setSearchResults(results);
      } catch {
        setSearchResults(null);
      } finally {
        setSearchLoading(false);
      }
    }, 300);
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearch(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Keyboard shortcut
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        const input = document.getElementById("global-search-input");
        input?.focus();
      }
      if (e.key === "Escape") {
        setShowSearch(false);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const clearSearch = () => {
    setSearchQuery("");
    setSearchResults(null);
    setShowSearch(false);
  };

  const hasResults = searchResults && (searchResults.boards?.length > 0 || searchResults.cards?.length > 0);

  return (
    <header
      className="h-16 flex items-center justify-between px-6 gap-4"
      style={{ background: "var(--color-background)" }}
    >
      {/* Search Bar */}
      <div className="flex-1 max-w-md relative" ref={searchRef}>
        <div
          className="flex items-center gap-2 py-2.5 px-4 rounded-2xl transition-smooth"
          style={{
            background: "var(--color-card)",
            border: `1px solid ${showSearch ? "var(--color-primary)" : "var(--color-border)"}`,
          }}
        >
          <Search size={16} style={{ color: "var(--color-muted-foreground)" }} />
          <input
            id="global-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            onFocus={() => { if (searchQuery.length >= 2) setShowSearch(true); }}
            placeholder="Search boards & tasks..."
            className="bg-transparent outline-none text-sm flex-1"
            style={{ color: "var(--color-foreground)" }}
          />
          {searchQuery ? (
            <button onClick={clearSearch} className="cursor-pointer hover:opacity-70 transition-smooth">
              <X size={14} style={{ color: "var(--color-muted-foreground)" }} />
            </button>
          ) : (
            <kbd
              className="text-[10px] py-0.5 px-1.5 rounded-md font-mono"
              style={{
                background: "var(--color-secondary)",
                color: "var(--color-muted-foreground)",
              }}
            >
              ⌘K
            </kbd>
          )}
        </div>

        {/* Search Results Dropdown */}
        {showSearch && (
          <div
            className="absolute left-0 right-0 top-14 rounded-2xl p-3 fade-in z-50 max-h-[70vh] overflow-y-auto"
            style={{
              background: "var(--color-card)",
              boxShadow: "var(--shadow-dropdown)",
              border: "1px solid var(--color-border)",
            }}
          >
            {searchLoading ? (
              <div className="flex items-center justify-center py-6">
                <div className="w-5 h-5 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : !hasResults ? (
              <p className="text-sm text-center py-6" style={{ color: "var(--color-muted-foreground)" }}>
                No results found for &quot;{searchQuery}&quot;
              </p>
            ) : (
              <>
                {/* Boards */}
                {searchResults.boards?.length > 0 && (
                  <div className="mb-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wider mb-1.5 px-2" style={{ color: "var(--color-muted-foreground)" }}>
                      Boards
                    </p>
                    {searchResults.boards.map((board: any) => (
                      <Link
                        key={board.id}
                        href={`/dashboard/board/${board.id}`}
                        onClick={clearSearch}
                        className="flex items-center gap-3 py-2 px-2 rounded-xl transition-smooth hover:bg-[var(--color-secondary)]"
                      >
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "var(--color-column-review)" }}>
                          <LayoutDashboard size={14} style={{ color: "var(--color-info)" }} />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{board.title}</p>
                          <p className="text-[10px]" style={{ color: "var(--color-muted-foreground)" }}>{board.workspace.name}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}

                {/* Cards */}
                {searchResults.cards?.length > 0 && (
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider mb-1.5 px-2" style={{ color: "var(--color-muted-foreground)" }}>
                      Tasks
                    </p>
                    {searchResults.cards.map((card: any) => (
                      <Link
                        key={card.id}
                        href={`/dashboard/board/${card.list.board.id}`}
                        onClick={clearSearch}
                        className="flex items-center gap-3 py-2 px-2 rounded-xl transition-smooth hover:bg-[var(--color-secondary)]"
                      >
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "var(--color-column-progress)" }}>
                          <Search size={14} style={{ color: "var(--color-warning)" }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{card.title}</p>
                          <div className="flex items-center gap-1.5">
                            <p className="text-[10px]" style={{ color: "var(--color-muted-foreground)" }}>
                              {card.list.board.title} · {card.list.title}
                            </p>
                            {card.labels?.map((cl: any) => (
                              <span
                                key={cl.label.id}
                                className="w-2 h-2 rounded-full"
                                style={{ background: cl.label.color }}
                              />
                            ))}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3">
        {/* Notification Bell */}
        <NotificationDropdown />

        {/* User Avatar */}
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 py-1.5 px-2 rounded-xl transition-smooth hover:bg-[var(--color-secondary)] cursor-pointer"
          >
            <div className="w-8 h-8 rounded-full overflow-hidden bg-[var(--color-muted)] flex items-center justify-center">
              {session?.user?.image ? (
                <Image
                  src={session.user.image}
                  alt={session.user.name || "User"}
                  width={32}
                  height={32}
                  className="object-cover"
                />
              ) : (
                <User size={16} style={{ color: "var(--color-muted-foreground)" }} />
              )}
            </div>
            <span className="text-sm font-medium max-w-[100px] truncate">
              {session?.user?.name || "User"}
            </span>
            <ChevronDown size={14} style={{ color: "var(--color-muted-foreground)" }} />
          </button>

          {/* User dropdown */}
          {showUserMenu && (
            <div
              className="absolute right-0 top-12 w-52 rounded-2xl p-2 fade-in z-50"
              style={{
                background: "var(--color-card)",
                boxShadow: "var(--shadow-dropdown)",
                border: "1px solid var(--color-border)",
              }}
            >
              <Link href="/dashboard/settings" className="w-full flex items-center gap-2 py-2 px-3 rounded-xl text-sm transition-smooth hover:bg-[var(--color-secondary)] text-left cursor-pointer">
                <User size={16} />
                Profile
              </Link>
              <Link href="/dashboard/settings" className="w-full flex items-center gap-2 py-2 px-3 rounded-xl text-sm transition-smooth hover:bg-[var(--color-secondary)] text-left cursor-pointer">
                <Settings size={16} />
                Settings
              </Link>
              <div className="h-px my-1" style={{ background: "var(--color-border)" }} />
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="w-full flex items-center gap-2 py-2 px-3 rounded-xl text-sm transition-smooth hover:bg-red-50 text-left cursor-pointer"
                style={{ color: "var(--color-destructive)" }}
              >
                <LogOut size={16} />
                Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
