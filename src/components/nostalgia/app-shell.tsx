"use client";

import { useState } from "react";
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
  Bell,
  X,
  Shield,
  Star,
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
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard, desc: "Your memory overview" },
  { key: "vaults", label: "TimeVaults", icon: Lock, desc: "Sealed capsules awaiting their day" },
  { key: "albums", label: "Albums", icon: Images, desc: "Photo collections you keep open" },
  { key: "journals", label: "Journal", icon: BookHeart, desc: "Your living diary" },
  { key: "friends", label: "Friends", icon: Users, desc: "People you remember with" },
  { key: "calendar", label: "Calendar", icon: CalendarHeart, desc: "Upcoming unlocks" },
  { key: "discover", label: "Discover", icon: Globe2, desc: "Public capsules from the community" },
  { key: "settings", label: "Settings", icon: Settings, desc: "Account & preferences" },
  { key: "admin", label: "Admin Panel", icon: Shield, desc: "Owner-only controls", adminOnly: true },
];

export function AppShell() {
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();
  const [active, setActive] = useState<ViewKey>("dashboard");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);

  const user = session?.user;
  if (!user) {
    return null;
  }

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
              onClick={() => {
                toast.success("Signed out. See you soon!", { duration: 6000 });
                setTimeout(async () => {
                  await signOut({ redirect: false });
                  // Manually redirect to the CURRENT origin's root.
                  // Don't use callbackUrl="/" because NextAuth constructs it
                  // using NEXTAUTH_URL env var, which is set to localhost:3000
                  // — that breaks on z.ai preview / Vercel where the origin
                  // is different.
                  window.location.href = window.location.origin + "/";
                }, 400);
              }}
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
                  onClick={() => {
                    toast.success("Signed out. See you soon!", { duration: 6000 });
                    setTimeout(async () => {
                      await signOut({ redirect: false });
                      window.location.href = window.location.origin + "/";
                    }, 400);
                  }}
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
            <NotificationsBell />
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="size-9 grid place-items-center rounded-full hover:bg-muted text-foreground"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </button>
            <div className="size-9 rounded-full bg-gradient-to-br from-primary to-accent grid place-items-center text-primary-foreground font-semibold text-sm overflow-hidden">
              {user.avatar ? (
                <img src={user.avatar} alt={user.name || "User"} className="w-full h-full object-cover" />
              ) : (
                user.name?.[0]?.toUpperCase() || "U"
              )}
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
              {active === "vaults" && <VaultView />}
              {active === "albums" && <AlbumsView />}
              {active === "journals" && <JournalView />}
              {active === "friends" && <FriendsView />}
              {active === "calendar" && <CalendarView />}
              {active === "discover" && <DiscoverView />}
              {active === "settings" && <SettingsView />}
              {active === "admin" && user?.role === "ADMIN" && <AdminView />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
      <HelpBot />
      <ReviewModal open={reviewOpen} onClose={() => setReviewOpen(false)} />
    </div>
  );
}
