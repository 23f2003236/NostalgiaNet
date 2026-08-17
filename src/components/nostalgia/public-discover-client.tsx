"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Globe2,
  Search,
  Lock,
  Sparkles,
  Users,
  Tag,
  ArrowUpRight,
} from "lucide-react";
import { VaultCard } from "@/components/nostalgia/vault-card";
import { formatCountdown, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Vault } from "@/lib/api";

type VaultsByCategory = Record<string, Vault[]>;

const CATEGORY_LABELS: Record<string, string> = {
  travel: "Travel capsules",
  family: "Family memories",
  friendship: "Friendship vaults",
  milestones: "Milestones",
  letters: "Letters to future selves",
  music: "Music moments",
  uncategorized: "Other capsules",
};

const CATEGORIES = [
  { key: "", label: "All" },
  { key: "travel", label: "Travel" },
  { key: "family", label: "Family" },
  { key: "friendship", label: "Friendship" },
  { key: "milestones", label: "Milestones" },
  { key: "letters", label: "Letters" },
  { key: "music", label: "Music" },
];

export function PublicDiscoverClient({
  vaults,
  byCategory,
}: {
  vaults: Vault[];
  byCategory: VaultsByCategory;
}) {
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");

  const filtered = vaults.filter((v) => {
    if (category && v.category !== category) return false;
    if (q.trim()) {
      const needle = q.toLowerCase();
      const hay = `${v.title} ${v.description || ""} ${v.user?.name || ""}`.toLowerCase();
      if (!hay.includes(needle)) return false;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="sticky top-0 z-30 glass-dark border-b border-border/60">
        <div className="container mx-auto px-4 lg:px-8 py-3 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2.5">
            <span className="font-display text-lg font-semibold">
              Nostalgia<span className="text-accent">Net</span>
            </span>
          </a>
          <a
            href="/?auth=signup"
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-primary text-primary-foreground text-sm font-medium shadow-warm hover:shadow-glow transition-all"
          >
            <Sparkles className="size-3.5" />
            Make your own
          </a>
        </div>
      </header>

      <main className="container mx-auto px-4 lg:px-8 py-8 lg:py-12 max-w-6xl">
        <div className="mb-8">
          <div className="text-sm text-muted-foreground mb-1 flex items-center gap-2">
            <Globe2 className="size-3.5 text-accent" />
            <span>Discover</span>
          </div>
          <h1 className="font-display text-3xl lg:text-5xl font-semibold tracking-tight">
            Public capsules from{" "}
            <span className="text-gradient-warm italic">memory-keepers</span>
          </h1>
          <p className="mt-3 text-muted-foreground font-serif text-base lg:text-lg max-w-2xl">
            Time capsules sealed by people around the world. Each one waits for
            its unlock day — browse what&apos;s open now, see what&apos;s coming,
            and add your own to the timeline.
          </p>
        </div>

        {/* Search & filters */}
        <div className="space-y-3 mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search capsules by title, description, or creator..."
              className="w-full pl-11 pr-4 py-3 rounded-full bg-card border border-border focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/15 text-sm transition-all"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <button
                key={c.key}
                onClick={() => setCategory(c.key)}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-all",
                  category === c.key
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border bg-card hover:border-primary/40 text-muted-foreground"
                )}
              >
                {c.key === "" ? <Sparkles className="size-3" /> : <Tag className="size-3" />}
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Result */}
        {filtered.length === 0 ? (
          <div className="text-center py-20 px-6 rounded-3xl border border-dashed border-border/60 bg-muted/30">
            <div className="size-16 mx-auto mb-4 rounded-2xl bg-card border border-border/60 grid place-items-center">
              <Globe2 className="size-7 text-accent" />
            </div>
            <h3 className="font-display text-xl font-semibold mb-1">
              No capsules match
            </h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
              Try a different search or category. Or create the first public
              capsule of this kind.
            </p>
            <a
              href="/?auth=signup"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-primary-foreground font-medium text-sm shadow-warm hover:shadow-glow transition-all"
            >
              <Sparkles className="size-4" />
              Start your capsule
            </a>
          </div>
        ) : (
          <>
            <div className="mb-4 text-xs text-muted-foreground flex items-center gap-2">
              <Users className="size-3" />
              Showing {filtered.length} {filtered.length === 1 ? "capsule" : "capsules"}
              {category && (
                <span>
                  {" "}
                  in{" "}
                  <span className="text-accent font-medium">
                    {CATEGORY_LABELS[category] || category}
                  </span>
                </span>
              )}
            </div>
            <motion.div layout className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map((v) => (
                <a
                  key={v.id}
                  href={`/v/${v.id}`}
                  className="block group"
                >
                  <VaultCard vault={v} />
                </a>
              ))}
            </motion.div>
          </>
        )}

        {/* SEO-friendly category sections */}
        {!q && !category && (
          <div className="mt-20 space-y-12">
            <h2 className="font-display text-2xl font-semibold">
              Browse by category
            </h2>
            {Object.entries(byCategory).map(([cat, list]) => (
              <div key={cat}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display text-lg font-semibold">
                    {CATEGORY_LABELS[cat] || cat}
                  </h3>
                  <button
                    onClick={() => setCategory(cat === "uncategorized" ? "" : cat)}
                    className="text-xs text-primary hover:underline inline-flex items-center gap-1"
                  >
                    See all <ArrowUpRight className="size-3" />
                  </button>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {list.slice(0, 3).map((v) => (
                    <a
                      key={v.id}
                      href={`/v/${v.id}`}
                      className="block group"
                    >
                      <VaultCard vault={v} />
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* CTA at bottom */}
        <div className="mt-20 text-center py-12 px-6 rounded-3xl bg-gradient-to-br from-primary/10 via-accent/10 to-primary/5 border border-border/60">
          <h2 className="font-display text-2xl lg:text-3xl font-semibold mb-2">
            Seal a moment of your own
          </h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
            NostalgiaNet++ is free. Your capsule could be the next one people
            discover on this page.
          </p>
          <a
            href="/?auth=signup"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-primary-foreground font-medium shadow-warm hover:shadow-glow transition-all hover:-translate-y-0.5"
          >
            <Sparkles className="size-4" />
            Start free
          </a>
        </div>
      </main>
    </div>
  );
}
