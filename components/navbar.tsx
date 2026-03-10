"use client";

import { useSession, signOut } from "next-auth/react";
import { Bell, Search, ChevronDown, LogOut, User, Settings, LayoutDashboard, X } from "lucide-react";
import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { NotificationDropdown } from "./notifications/notification-dropdown";
import { WorkspaceSwitcher } from "./workspace-switcher";
import { globalSearch } from "@/actions/search";
import { cn } from "@/lib/utils";

export function Navbar() {
  const { data: session } = useSession();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Close mobile menu on route change logic (simplified as we don't have direct access to next router here, 
  // but we can use useEffect on pathname if it was passed or use link clicks)
  
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
        if (!searchQuery) setIsSearchExpanded(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [searchQuery]);

  // Keyboard shortcut
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsSearchExpanded(true);
        setTimeout(() => {
            const input = document.getElementById("global-search-input");
            input?.focus();
        }, 100);
      }
      if (e.key === "Escape") {
        setShowSearch(false);
        if (!searchQuery) setIsSearchExpanded(false);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [searchQuery]);

  const clearSearch = () => {
    setSearchQuery("");
    setSearchResults(null);
    setShowSearch(false);
    setIsSearchExpanded(false);
  };

  const hasResults = searchResults && (searchResults.boards?.length > 0 || searchResults.cards?.length > 0);

  return (
    <>
      <header
        className="h-16 flex items-center justify-between px-4 md:px-6 gap-4 sticky top-0 z-40 transition-smooth"
        style={{ background: "var(--color-background)" }}
      >
        <div className="flex items-center gap-3">
            {/* Title / Logo for Mobile */}
            <Link href="/dashboard" className="lg:hidden font-black text-lg tracking-tight hover:opacity-80 transition-smooth">
                Natakarya
            </Link>
        </div>

        {/* Search Bar */}
        <div 
            className={cn(
                "flex-1 relative transition-all duration-300",
                isSearchExpanded ? "max-w-md" : "max-w-[40px] md:max-w-md"
            )} 
            ref={searchRef}
        >
          <div
            className={cn(
                "flex items-center gap-2 py-2.5 px-4 rounded-2xl transition-smooth group",
                isSearchExpanded ? "bg-[var(--color-card)] border-[var(--color-primary)]" : "bg-transparent md:bg-[var(--color-card)] border-transparent md:border-[var(--color-border)] hover:bg-[var(--color-secondary)]/50"
            )}
            style={{
              borderWidth: "1px",
              borderStyle: "solid",
            }}
          >
            <button 
                onClick={() => setIsSearchExpanded(true)}
                className="cursor-pointer text-[var(--color-muted-foreground)] group-hover:text-[var(--color-info)] transition-smooth"
            >
                <Search size={16} />
            </button>
            <input
              id="global-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              onFocus={() => { 
                  setIsSearchExpanded(true);
                  if (searchQuery.length >= 2) setShowSearch(true); 
              }}
              placeholder="Search..."
              className={cn(
                  "bg-transparent outline-none text-sm flex-1 transition-all duration-300",
                  isSearchExpanded ? "opacity-100" : "opacity-0 md:opacity-100 w-0 md:w-auto"
              )}
              style={{ color: "var(--color-foreground)" }}
            />
            {(searchQuery && isSearchExpanded) && (
              <button onClick={clearSearch} className="cursor-pointer hover:opacity-70 transition-smooth">
                <X size={14} style={{ color: "var(--color-muted-foreground)" }} />
              </button>
            )}
            {!isSearchExpanded && (
              <kbd
                className="hidden md:block text-[10px] py-0.5 px-1.5 rounded-md font-mono"
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
          {showSearch && isSearchExpanded && (
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
        <div className="flex items-center gap-2 md:gap-3">
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
              <span className="hidden sm:block text-sm font-medium max-w-[100px] truncate">
                {session?.user?.name || "User"}
              </span>
              <ChevronDown size={14} style={{ color: "var(--color-muted-foreground)" }} className="hidden sm:block" />
            </button>

            {/* User dropdown */}
            {showUserMenu && (
              <div
                className="absolute right-0 top-12 w-52 rounded-2xl p-2 fade-in z-50 shadow-2xl"
                style={{
                  background: "var(--color-card)",
                  boxShadow: "var(--shadow-dropdown)",
                  border: "1px solid var(--color-border)",
                }}
              >
                <Link href="/dashboard/settings" onClick={() => setShowUserMenu(false)} className="w-full flex items-center gap-2 py-2.5 px-3 rounded-xl text-sm transition-smooth hover:bg-[var(--color-secondary)] text-left cursor-pointer">
                  <User size={16} />
                  Profile
                </Link>
                <Link href="/dashboard/settings" onClick={() => setShowUserMenu(false)} className="w-full flex items-center gap-2 py-2.5 px-3 rounded-xl text-sm transition-smooth hover:bg-[var(--color-secondary)] text-left cursor-pointer">
                  <Settings size={16} />
                  Settings
                </Link>
                <div className="h-px my-1.5" style={{ background: "var(--color-border)" }} />
                <button
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="w-full flex items-center gap-2 py-2.5 px-3 rounded-xl text-sm transition-smooth hover:bg-red-50 text-left cursor-pointer"
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

    </>
  );
}
