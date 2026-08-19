"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession, signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Lock,
  BookHeart,
  Users,
  CalendarHeart,
  Settings,
  LogOut,
  Moon,
  Sun,
  Search,
  ChevronRight,
  Images,
  Globe2,
  X,
  Shield,
  Star,
  Palette,
  Check,
} from "lucide-react";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { Logo } from "@/components/icons/logo";
import { cn } from "@/lib/utils";
import { DashboardHome } from "@/components/nostalgia/views/dashboard-home";
import { VaultView } from "@/components/nostalgia/views/vault-view";
import { JournalView } from "@/components/nostalgia/views/journal-view";
import { FriendsView } from "@/components/nostalgia/views/friends-view";
import { CalendarView } from "@/components/nostalgia/views/calendar-view";
import { SettingsView } from "@/components/nostalgia/views/settings-view";
import { AlbumsView } from "@/components/nostalgia/views/albums-view";
import { DiscoverView } from "@/components/nostalgia/views/discover-view";
import { AdminView } from "@/components/nostalgia/views/admin-view";
import { NotificationsBell } from "@/components/nostalgia/notifications-bell";
import { HelpBot } from "@/components/nostalgia/help-bot";
import { ReviewModal } from "@/components/nostalgia/review-modal";

/* ── Color themes (same palette as settings-view) ── */
const THEMES = [
  { key: "sepia",    label: "Warm Sepia",     desc: "Original",   color: "oklch(0.55 0.13 55)",  accent: "oklch(0.65 0.13 45)" },
  { key: "ocean",    label: "Ocean Blue",      desc: "Calm & cool", color: "oklch(0.50 0.15 240)", accent: "oklch(0.60 0.13 200)" },
  { key: "forest",   label: "Forest Green",    desc: "Earthy",     color: "oklch(0.50 0.12 150)", accent: "oklch(0.62 0.13 165)" },
  { key: "rose",     label: "Rose Pink",       desc: "Romantic",   color: "oklch(0.55 0.18 10)",  accent: "oklch(0.65 0.15 350)" },
  { key: "midnight", label: "Midnight Purple", desc: "Premium",    color: "oklch(0.50 0.18 290)", accent: "oklch(0.62 0.18 320)" },
  { key: "sunset",   label: "Sunset Orange",   desc: "Vibrant",    color: "oklch(0.62 0.20 35)",  accent: "oklch(0.65 0.18 20)" },
  { key: "slate",    label: "Mono Slate",      desc: "Minimal",    color: "oklch(0.40 0.015 250)", accent: "oklch(0.55 0.02 250)" },
];

function applyColorTheme(key: string) {
  if (typeof window === "undefined") return;
  document.documentElement.setAttribute("data-theme", key);
  try { localStorage.setItem("nostalgianet-theme", key); } catch {}
}

export type ViewKey =
  | "dashboard"
  | "vaults"
  | "journals"
  | "friends"
  | "calendar"
  | "albums"
  | "discover"
  | "settings"
  | "admin";

const NAV: { key: ViewKey; label: string; icon: React.ElementType; desc: string; adminOnly?: boolean }[] = [
  { key: "dashboard", label: "Dashboard",  icon: LayoutDashboard, desc: "Your memory overview" },
  { key: "vaults",    label: "TimeVaults", icon: Lock,            desc: "Sealed capsules awaiting their day" },
  { key: "albums",    label: "Albums",     icon: Images,          desc: "Photo collections you keep open" },
  { key: "journals",  label: "Journal",    icon: BookHeart,       desc: "Your living diary" },
  { key: "friends",   label: "Friends",    icon: Users,           desc: "People you remember with" },
  { key: "calendar",  label: "Calendar",   icon: CalendarHeart,   desc: "Upcoming unlocks" },
  { key: "discover",  label: "Discover",   icon: Globe2,          desc: "Public capsules from the community" },
  { key: "settings",  label: "Settings",   icon: Settings,        desc: "Account & preferences" },
  { key: "admin",     label: "Admin Panel", icon: Shield,         desc: "Owner-only controls", adminOnly: true },
];

export function AppShell() {
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();
  const [active, setActive] = useState<ViewKey>("dashboard");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [dontAskLogout, setDontAskLogout] = useState(false);
  const [themePickerOpen, setThemePickerOpen] = useState(false);
  const [activeTheme, setActiveTheme] = useState("slate");
  const [loggingOut, setLoggingOut] = useState(false);
  const themeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      /* eslint-disable react-hooks/set-state-in-effect */
      setDontAskLogout(localStorage.getItem("nostalgianet-skip-logout") === "true");
      const saved = localStorage.getItem("nostalgianet-theme") || "slate";
      setActiveTheme(saved);
      /* eslint-enable react-hooks/set-state-in-effect */
    } catch {}
  }, []);

  // Close theme picker on outside click
  useEffect(() => {
    if (!themePickerOpen) return;
    const handler = (e: MouseEvent) => {
      if (themeRef.current && !themeRef.current.contains(e.target as Node)) {
        setThemePickerOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [themePickerOpen]);

  const handleTheme = (key: string) => {
    applyColorTheme(key);
    setActiveTheme(key);
    setThemePickerOpen(false);
  };

  const user = session?.user;
  if (!user) return null;

  const doLogout = () => {
    toast.success("Signed out. See you soon!", { duration: 3000 });
    // Show overlay immediately — hides any React re-renders during signOut
    setLoggingOut(true);
    setTimeout(async () => {
      // Sign out first so the session cookie is cleared BEFORE we navigate.
      // The overlay above keeps the screen blank so no auth-flash shows.
      await signOut({ redirect: false });
      window.location.href = window.location.origin + "/";
    }, 350);
  };

  const handleLogoutClick = () => {
    if (dontAskLogout) { doLogout(); } else { setLogoutOpen(true); }
  };

  const handleLogoutConfirm = (dontAsk: boolean) => {
    setLogoutOpen(false);
    if (dontAsk) {
      try { localStorage.setItem("nostalgianet-skip-logout", "true"); } catch {}
      setDontAskLogout(true);
    }
    doLogout();
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar - desktop */}
      <aside className="hidden lg:flex w-72 shrink-0 flex-col border-r border-border/60 bg-sidebar/60 backdrop-blur-xl">
        <div className="p-5 flex items-center gap-2.5">
          <Logo className="size-9" />
          <div>
            <div className="font-display text-lg font-semibold leading-none">
              Nostalgia<span className="text-accent">Net</span>++
            </div>
            <div className="text-[10px] text-muted-foreground mt-1">
              Memories live forever
            </div>
          </div>
        </div>

        <div className="vintage-divider mx-5" />

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {NAV.filter((item) => !item.adminOnly || user?.role === "ADMIN").map((item) => (
            <button
              key={item.key}
              onClick={() => setActive(item.key)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all group",
                active === item.key
                  ? "bg-primary/10 text-primary"
                  : "text-foreground/80 hover:bg-muted/60"
              )}
            >
              <item.icon
                className={cn(
                  "size-4.5 shrink-0",
                  active === item.key ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                )}
              />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium">{item.label}</div>
                <div className="text-[10px] text-muted-foreground truncate">
                  {item.desc}
                </div>
              </div>
              {active === item.key && (
                <ChevronRight className="size-3.5 text-primary" />
              )}
            </button>
          ))}
        </nav>

        {/* Rate this app button */}
        <div className="px-3 pb-1">
          <button
            onClick={() => setReviewOpen(true)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-accent/10 hover:bg-accent/20 text-accent text-xs font-medium transition-all border border-accent/20 hover:border-accent/40"
          >
            <Star className="size-3.5 fill-accent" />
            <span>Rate NostalgiaNet++</span>
          </button>
        </div>

        <div className="p-3 border-t border-border/60">
          <div className="flex items-center gap-3 p-2.5 rounded-xl bg-muted/60">
            <div className="size-9 rounded-full bg-gradient-to-br from-primary to-accent grid place-items-center text-primary-foreground font-semibold text-sm shrink-0 overflow-hidden">
              {user.avatar ? (
                <img src={user.avatar} alt={user.name || "User"} className="w-full h-full object-cover" />
              ) : (
                user.name?.[0]?.toUpperCase() || "U"
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{user.name}</div>
              <div className="text-[10px] text-muted-foreground truncate">
                {user.email}
              </div>
            </div>
            <button
              onClick={handleLogoutClick}
              className="size-8 grid place-items-center rounded-full hover:bg-background text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Sign out"
              title="Sign out"
            >
              <LogOut className="size-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 bg-background/60 backdrop-blur-sm z-40"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 240 }}
              className="lg:hidden fixed top-0 left-0 bottom-0 w-72 bg-sidebar border-r border-border/60 z-50 flex flex-col"
            >
              <div className="p-5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Logo className="size-9" />
                  <div className="font-display text-lg font-semibold leading-none">
                    Nostalgia<span className="text-accent">Net</span>++
                  </div>
                </div>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="size-8 grid place-items-center rounded-full hover:bg-muted"
                  aria-label="Close"
                >
                  <X className="size-4" />
                </button>
              </div>
              <nav className="flex-1 p-3 space-y-1">
                {NAV.filter((item) => !item.adminOnly || user?.role === "ADMIN").map((item) => (
                  <button
                    key={item.key}
                    onClick={() => {
                      setActive(item.key);
                      setMobileOpen(false);
                    }}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left",
                      active === item.key
                        ? "bg-primary/10 text-primary"
                        : "text-foreground/80 hover:bg-muted"
                    )}
                  >
                    <item.icon className="size-4.5" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </button>
                ))}
              </nav>
              <div className="p-3 border-t border-border/60">
                <button
                  onClick={handleLogoutClick}
                  className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm hover:bg-muted"
                >
                  <LogOut className="size-4" />
                  Sign out
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main */}
      <main className="flex-1 min-w-0 flex flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-30 glass-dark border-b border-border/60">
          <div className="flex items-center gap-3 px-4 lg:px-8 py-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden size-9 grid place-items-center rounded-lg hover:bg-muted"
              aria-label="Open menu"
            >
              <Search className="size-4" />
            </button>
            <div className="relative flex-1 max-w-md hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search your memories..."
                className="w-full pl-9 pr-4 py-2 rounded-full bg-muted/60 border border-transparent focus:bg-background focus:border-primary/30 focus:outline-none text-sm transition-all"
              />
            </div>
            <div className="flex-1 sm:hidden" />
            <div className="text-xs text-muted-foreground hidden md:block">
              {new Date().toLocaleDateString(undefined, {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </div>

            {/* Right-side controls */}
            <NotificationsBell />

            {/* ── Color theme picker ── */}
            <div ref={themeRef} className="relative">
              <button
                onClick={() => setThemePickerOpen((v) => !v)}
                className={cn(
                  "size-9 grid place-items-center rounded-full hover:bg-muted transition-colors",
                  themePickerOpen ? "bg-muted text-primary" : "text-foreground"
                )}
                aria-label="Change theme"
                title="Change theme"
              >
                <Palette className="size-4" />
              </button>
              <AnimatePresence>
                {themePickerOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -6 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -6 }}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                    className="absolute right-0 top-full mt-2 w-52 glass border border-border/60 rounded-2xl p-2.5 shadow-warm z-50"
                  >
                    <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">
                      Theme
                    </div>
                    <div className="space-y-0.5">
                      {THEMES.map((t) => (
                        <div key={t.key} className="relative group/item">
                          {/* Hover preview card — appears to the left */}
                          <div className="pointer-events-none absolute right-full top-1/2 -translate-y-1/2 mr-2 z-50 opacity-0 group-hover/item:opacity-100 transition-opacity duration-150">
                            <div className="bg-card border border-border/80 rounded-xl p-3 shadow-warm w-[130px]">
                              <div className="flex items-center gap-1.5 mb-2">
                                <div className="size-5 rounded-full border border-border/40" style={{ background: t.color }} />
                                <div className="size-4 rounded-full border border-border/40" style={{ background: t.accent }} />
                              </div>
                              <div className="text-xs font-semibold">{t.label}</div>
                              <div className="text-[10px] text-muted-foreground">{t.desc}</div>
                            </div>
                          </div>
                          <button
                            onClick={() => handleTheme(t.key)}
                            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl hover:bg-muted/70 transition-colors text-left"
                          >
                            <div className="flex items-center gap-1 shrink-0">
                              <div className="size-4 rounded-full border border-border/30" style={{ background: t.color }} />
                              <div className="size-3 rounded-full border border-border/30" style={{ background: t.accent }} />
                            </div>
                            <span className="text-sm flex-1">{t.label}</span>
                            {activeTheme === t.key && (
                              <Check className="size-3.5 text-primary shrink-0" />
                            )}
                          </button>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* ── Dark / light toggle ── */}
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="size-9 grid place-items-center rounded-full hover:bg-muted text-foreground"
              aria-label="Toggle dark mode"
            >
              {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </button>

            {/* ── Profile avatar with hover tooltip ── */}
            <div className="relative group">
              <div className="size-9 rounded-full bg-gradient-to-br from-primary to-accent grid place-items-center text-primary-foreground font-semibold text-sm overflow-hidden cursor-pointer">
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name || "User"} className="w-full h-full object-cover" />
                ) : (
                  user.name?.[0]?.toUpperCase() || "U"
                )}
              </div>
              {/* Tooltip — appears on hover */}
              <div className="absolute right-0 top-11 z-50 hidden group-hover:block pointer-events-none">
                <div className="p-3 rounded-2xl bg-popover border border-border shadow-warm min-w-[180px]">
                  <div className="text-sm font-semibold truncate">{user.name}</div>
                  <div className="text-xs text-muted-foreground truncate mt-0.5">{user.email}</div>
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 p-4 lg:p-8 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
            >
              {active === "dashboard" && <DashboardHome onNavigate={setActive} />}
              {active === "vaults"    && <VaultView />}
              {active === "albums"    && <AlbumsView />}
              {active === "journals"  && <JournalView />}
              {active === "friends"   && <FriendsView />}
              {active === "calendar"  && <CalendarView />}
              {active === "discover"  && <DiscoverView />}
              {active === "settings"  && <SettingsView />}
              {active === "admin" && user?.role === "ADMIN" && <AdminView />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      <HelpBot />
      <ReviewModal open={reviewOpen} onClose={() => setReviewOpen(false)} />
      <LogoutDialog
        open={logoutOpen}
        onConfirm={handleLogoutConfirm}
        onCancel={() => setLogoutOpen(false)}
      />
      {/* Full-screen overlay shown during sign-out to prevent any flash */}
      {loggingOut && (
        <div className="fixed inset-0 z-[200] bg-background flex items-center justify-center">
          <div className="text-muted-foreground text-sm animate-pulse">Signing out…</div>
        </div>
      )}
    </div>
  );
}

/* ── Logout confirmation dialog ── */
function LogoutDialog({
  open,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  onConfirm: (dontAsk: boolean) => void;
  onCancel: () => void;
}) {
  const [dontAsk, setDontAsk] = useState(false);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onCancel}
      />
      {/* Card */}
      <div className="relative bg-card border border-border rounded-2xl p-6 shadow-warm max-w-sm w-full mx-4">
        <h3 className="font-display text-lg font-semibold mb-1">Sign out?</h3>
        <p className="text-sm text-muted-foreground mb-5">
          You&apos;ll need to sign in again to access your memories.
        </p>

        {/* Don't ask again */}
        <label className="flex items-center gap-2.5 text-sm text-muted-foreground mb-6 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={dontAsk}
            onChange={(e) => setDontAsk(e.target.checked)}
            className="rounded accent-primary w-4 h-4"
          />
          Don&apos;t ask me again
        </label>

        <div className="flex gap-3">
          {/* No — primary / highlighted */}
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl font-semibold text-sm bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
          >
            No, stay
          </button>
          {/* Yes — subtle */}
          <button
            onClick={() => onConfirm(dontAsk)}
            className="flex-1 py-2.5 rounded-xl font-medium text-sm border border-border hover:bg-muted transition-colors text-muted-foreground"
          >
            Yes, sign out
          </button>
        </div>
      </div>
    </div>
  );
}
