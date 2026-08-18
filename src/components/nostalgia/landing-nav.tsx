"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Moon, Sun, Sparkles, Palette, Check } from "lucide-react";
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

const THEMES = [
  { key: "slate",    label: "Mono Slate",       desc: "Minimal",  color: "oklch(0.40 0.015 250)", accent: "oklch(0.55 0.02 250)" },
  { key: "sepia",   label: "Warm Sepia",        desc: "Original", color: "oklch(0.55 0.13 55)",   accent: "oklch(0.65 0.13 45)" },
  { key: "ocean",   label: "Ocean Blue",        desc: "Cool",     color: "oklch(0.50 0.15 240)",   accent: "oklch(0.60 0.13 200)" },
  { key: "forest",  label: "Forest Green",      desc: "Earthy",   color: "oklch(0.50 0.12 150)",   accent: "oklch(0.62 0.13 165)" },
  { key: "rose",    label: "Rose Pink",         desc: "Romantic", color: "oklch(0.55 0.18 10)",    accent: "oklch(0.65 0.15 350)" },
  { key: "midnight",label: "Midnight Purple",   desc: "Premium",  color: "oklch(0.50 0.18 290)",   accent: "oklch(0.62 0.18 320)" },
  { key: "sunset",  label: "Sunset Orange",     desc: "Vibrant",  color: "oklch(0.62 0.20 35)",    accent: "oklch(0.65 0.18 20)" },
];

function applyTheme(key: string) {
  if (typeof window === "undefined") return;
  document.documentElement.setAttribute("data-theme", key);
  try { localStorage.setItem("nostalgianet-theme", key); } catch {}
}

export function LandingNav({ onGetStarted }: { onGetStarted: () => void }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [themeOpen, setThemeOpen] = useState(false);
  const [activeTheme, setActiveTheme] = useState<string>("slate");
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const themeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    setMounted(true);
    // Read saved theme from localStorage
    try {
      const saved = localStorage.getItem("nostalgianet-theme") || "slate";
      setActiveTheme(saved);
    } catch {}
    /* eslint-enable react-hooks/set-state-in-effect */

    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    // Close theme dropdown on outside click
    const onClickOutside = (e: MouseEvent) => {
      if (themeRef.current && !themeRef.current.contains(e.target as Node)) {
        setThemeOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => {
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("mousedown", onClickOutside);
    };
  }, []);

  const handleTheme = (key: string) => {
    applyTheme(key);
    setActiveTheme(key);
    setThemeOpen(false);
  };

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
              Nostalgia<span className="text-accent">Net</span>++
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
            {/* Theme picker */}
            {mounted && (
              <div ref={themeRef} className="relative">
                <button
                  onClick={() => setThemeOpen((v) => !v)}
                  className={cn(
                    "size-9 grid place-items-center rounded-full hover:bg-muted/60 transition-colors",
                    themeOpen ? "bg-muted/60 text-primary" : "text-foreground"
                  )}
                  aria-label="Change theme"
                  title="Change theme"
                >
                  <Palette className="size-4" />
                </button>

                <AnimatePresence>
                  {themeOpen && (
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
                            {/* Hover preview — shown to the left */}
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
            )}

            {/* Dark / light toggle */}
            {mounted && (
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="size-9 grid place-items-center rounded-full hover:bg-muted/60 transition-colors text-foreground"
                aria-label="Toggle dark mode"
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
