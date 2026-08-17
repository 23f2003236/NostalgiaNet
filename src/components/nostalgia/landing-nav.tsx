"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Moon, Sun, Sparkles } from "lucide-react";
import { useTheme } from "next-themes";
import { Logo } from "@/components/icons/logo";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "#features", label: "Features" },
  { href: "#how", label: "How it works" },
  { href: "#testimonials", label: "Stories" },
  { href: "#faq", label: "FAQ" },
  { href: "/discover", label: "Discover", external: true },
];

export function LandingNav({ onGetStarted }: { onGetStarted: () => void }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // hydration-safe mount + scroll listener
    setMounted(true); // eslint-disable-line react-hooks/set-state-in-effect
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed top-0 inset-x-0 z-50 transition-all duration-500",
        scrolled ? "py-2" : "py-4"
      )}
    >
      <div className="container mx-auto px-4 lg:px-8">
        <div
          className={cn(
            "flex items-center justify-between gap-6 transition-all duration-500 rounded-full",
            scrolled
              ? "glass border border-border/60 shadow-warm px-4 py-2"
              : "px-2 py-2"
          )}
        >
          <a href="#" className="flex items-center gap-2.5 text-foreground">
            <Logo className="size-9" />
            <span className="font-display text-lg font-semibold tracking-tight">
              Nostalgia<span className="text-accent">Net</span>
            </span>
          </a>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-muted/60"
              >
                {l.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {mounted && (
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="size-9 grid place-items-center rounded-full hover:bg-muted/60 transition-colors text-foreground"
                aria-label="Toggle theme"
              >
                {theme === "dark" ? (
                  <Sun className="size-4" />
                ) : (
                  <Moon className="size-4" />
                )}
              </button>
            )}
            <button
              onClick={onGetStarted}
              className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm font-medium shadow-warm hover:shadow-glow transition-all hover:-translate-y-0.5"
            >
              <Sparkles className="size-3.5" />
              Get started
            </button>
            <button
              onClick={() => setOpen((v) => !v)}
              className="md:hidden size-9 grid place-items-center rounded-full hover:bg-muted/60 text-foreground"
              aria-label="Menu"
            >
              {open ? <X className="size-4" /> : <Menu className="size-4" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="md:hidden mt-2 glass border border-border/60 rounded-2xl p-2"
            >
              {NAV_LINKS.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="block px-4 py-3 text-sm font-medium text-foreground hover:bg-muted/60 rounded-xl"
                >
                  {l.label}
                </a>
              ))}
              <button
                onClick={() => {
                  setOpen(false);
                  onGetStarted();
                }}
                className="w-full mt-1 px-4 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-medium"
              >
                Get started
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}
