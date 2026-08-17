"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Globe2,
  Search,
  Lock,
  Sparkles,
  Users,
  Tag,
} from "lucide-react";
import { toast } from "sonner";
import { api, Vault } from "@/lib/api";
import { useSession } from "next-auth/react";
import { VaultCard, VaultDetail } from "@/components/nostalgia/vault-card";
import { formatCountdown, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

type Sort = "newest" | "soonest" | "oldest";
const CATEGORIES = [
  { key: "", label: "All" },
  { key: "travel", label: "Travel" },
  { key: "family", label: "Family" },
  { key: "friendship", label: "Friendship" },
  { key: "milestones", label: "Milestones" },
  { key: "letters", label: "Letters" },
  { key: "music", label: "Music" },
];

export function DiscoverView() {
  const { data: session } = useSession();
  const user = session?.user;
  const [vaults, setVaults] = useState<Vault[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Vault | null>(null);
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<Sort>("newest");
  const [category, setCategory] = useState("");

  useEffect(() => {
    let active = true;
    if (!user) return;
    const run = async () => {
      try {
        const r = await api.vaults.list("public", { q, sort, category });
        if (active) {
          setVaults(r.vaults || []);
          setLoading(false);
        }
      } catch {
        if (active) {
          toast("Could not load public feed");
          setLoading(false);
        }
      }
    };
    run();
    return () => { active = false; };
  }, [user, q, sort, category]);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <div className="text-sm text-muted-foreground mb-1 flex items-center gap-2">
          <Globe2 className="size-3.5 text-accent" />
          <span>Discover</span>
        </div>
        <h1 className="font-display text-3xl lg:text-4xl font-semibold tracking-tight">
          The <span className="text-gradient-warm italic">community feed</span>
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Public time capsules from memory-keepers around the world. Browse what
          others have chosen to share.
        </p>
      </div>

      {/* Search & filters */}
      <div className="space-y-3 mb-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search public capsules by title, description, or creator..."
            className="w-full pl-11 pr-4 py-3 rounded-full bg-card border border-border focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/15 text-sm transition-all"
          />
        </div>

        {/* Category chips */}
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

        {/* Sort */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-muted-foreground">Sort:</span>
          {([
            { key: "newest", label: "Newest" },
            { key: "soonest", label: "Unlocking soon" },
            { key: "oldest", label: "Oldest" },
          ] as { key: Sort; label: string }[]).map((s) => (
            <button
              key={s.key}
              onClick={() => setSort(s.key)}
              className={cn(
                "px-3 py-1 rounded-full transition-colors",
                sort === s.key
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="rounded-2xl overflow-hidden bg-card border border-border/60">
              <div className="aspect-[4/3] bg-muted animate-pulse" />
              <div className="p-4 space-y-2">
                <div className="h-3 bg-muted rounded animate-pulse w-1/2" />
                <div className="h-3 bg-muted rounded animate-pulse w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : vaults.length === 0 ? (
        <div className="text-center py-20 px-6 rounded-3xl border border-dashed border-border/60 bg-muted/30">
          <div className="size-16 mx-auto mb-4 rounded-2xl bg-card border border-border/60 grid place-items-center">
            <Globe2 className="size-7 text-accent" />
          </div>
          <h3 className="font-display text-xl font-semibold mb-1">
            No public capsules match
          </h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
            Try a different search or category. Or create a public capsule yourself and be the first.
          </p>
        </div>
      ) : (
        <>
          <div className="mb-4 text-xs text-muted-foreground flex items-center gap-2">
            <Users className="size-3" />
            Showing {vaults.length} {vaults.length === 1 ? "capsule" : "capsules"}
            {category && <span> in <span className="text-accent font-medium">{category}</span></span>}
          </div>
          <motion.div layout className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {vaults.map((v) => (
              <VaultCard
                key={v.id}
                vault={v}
                onOpen={() => setSelected(v)}
              />
            ))}
          </motion.div>
        </>
      )}

      {selected && (
        <VaultDetail vault={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}
