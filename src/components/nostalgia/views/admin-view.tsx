"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Shield,
  Users,
  Lock,
  Images,
  BookHeart,
  Trash2,
  Globe,
  Sparkles,
  Clock,
  Mail,
  AlertTriangle,
  Star,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { formatShortDate } from "@/lib/format";

type Stats = {
  totalUsers: number;
  totalVaults: number;
  totalAlbums: number;
  totalJournals: number;
  totalMemories: number;
  totalPublicVaults: number;
  sealedVaults: number;
  unlockedVaults: number;
  recentSignups: { id: string; name: string; email: string; avatar: string | null; createdAt: string }[];
};

type AdminUser = {
  id: string;
  email: string;
  name: string;
  avatar: string | null;
  bio: string | null;
  plan: string;
  role: string;
  createdAt: string;
  _count: { vaults: number; journals: number; albums: number };
};

type AdminVault = {
  id: string;
  title: string;
  description: string | null;
  coverImage: string | null;
  unlockAt: string;
  isPublic: boolean;
  isSealed: boolean;
  createdAt: string;
  user: { id: string; name: string; email: string };
  memories: { id: string; type: string; url: string; caption: string | null }[];
};

type AdminReview = {
  id: string;
  rating: number;
  comment: string | null;
  isApproved: boolean;
  createdAt: string;
  user: { id: string; name: string; email: string; avatar: string | null };
};

type Tab = "overview" | "users" | "vaults" | "reviews";

export function AdminView() {
  const [tab, setTab] = useState<Tab>("overview");
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [vaults, setVaults] = useState<AdminVault[]>([]);
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const run = async () => {
      try {
        const [s, u, v, rv] = await Promise.all([
          fetch("/api/admin/stats").then((r) => r.json()),
          fetch("/api/admin/users").then((r) => r.json()),
          fetch("/api/admin/vaults").then((r) => r.json()),
          fetch("/api/admin/reviews").then((r) => r.json()),
        ]);
        if (!active) return;
        setStats(s);
        setUsers(u.users || []);
        setVaults(v.vaults || []);
        setReviews(rv.reviews || []);
        setLoading(false);
      } catch {
        if (active) {
          toast.error("Could not load admin data");
          setLoading(false);
        }
      }
    };
    run();
    return () => { active = false; };
  }, []);

  const handleDeleteUser = async (id: string, name: string) => {
    if (!confirm(`Delete ${name}? This removes their vaults, journals, and albums permanently.`)) return;
    try {
      const res = await fetch(`/api/admin/users?id=${id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Could not delete user");
      }
      setUsers((prev) => prev.filter((u) => u.id !== id));
      toast.success(`Deleted ${name}`, { duration: 6000 });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    }
  };

  const handleDeleteVault = async (id: string, title: string) => {
    if (!confirm(`Delete vault "${title}"? This removes all its memories permanently.`)) return;
    try {
      const res = await fetch(`/api/admin/vaults?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Could not delete vault");
      setVaults((prev) => prev.filter((v) => v.id !== id));
      toast.success(`Deleted vault "${title}"`, { duration: 6000 });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    }
  };

  const handleDeleteMemory = async (vaultId: string, memoryId: string) => {
    try {
      const res = await fetch(`/api/admin/memories?id=${memoryId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Could not delete memory");
      setVaults((prev) =>
        prev.map((v) =>
          v.id === vaultId
            ? { ...v, memories: v.memories.filter((m) => m.id !== memoryId) }
            : v
        )
      );
      toast.success("Memory removed", { duration: 6000 });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    }
  };

  const handleApproveReview = async (id: string, approve: boolean) => {
    try {
      const res = await fetch(`/api/admin/reviews?id=${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isApproved: approve }),
      });
      if (!res.ok) throw new Error("Could not update review");
      setReviews((prev) =>
        prev.map((r) => (r.id === id ? { ...r, isApproved: approve } : r))
      );
      toast.success(approve ? "Review approved — now on landing page" : "Review unapproved", { duration: 6000 });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Update failed");
    }
  };

  const handleDeleteReview = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/reviews?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Could not delete review");
      setReviews((prev) => prev.filter((r) => r.id !== id));
      toast.success("Review deleted", { duration: 6000 });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <div className="text-sm text-muted-foreground mb-1 flex items-center gap-2">
          <Shield className="size-3.5 text-destructive" />
          <span>Admin</span>
        </div>
        <h1 className="font-display text-3xl lg:text-4xl font-semibold tracking-tight flex items-center gap-3">
          Admin <span className="text-gradient-warm italic">Panel</span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-destructive/15 text-destructive text-[10px] font-bold uppercase tracking-wide">
            <Shield className="size-2.5" /> Owner
          </span>
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Full control — see who signed up, what was posted, and remove anything that shouldn&apos;t be here.
        </p>
      </div>

      {/* Tabs */}
      <div className="inline-flex p-1 rounded-full bg-muted/60 border border-border/60 mb-6">
        {([
          { key: "overview", label: "Overview" },
          { key: "users", label: `Users (${users.length})` },
          { key: "vaults", label: `Vaults (${vaults.length})` },
          { key: "reviews", label: `Reviews (${reviews.length})` },
        ] as { key: Tab; label: string }[]).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "px-4 py-1.5 text-xs font-medium rounded-full transition-all",
              tab === t.key
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-2xl bg-muted/40 animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          {tab === "overview" && stats && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard icon={Users} label="Total users" value={stats.totalUsers} accent="from-blue-500/15 to-cyan-500/10" />
                <StatCard icon={Lock} label="Total vaults" value={stats.totalVaults} accent="from-amber-500/15 to-orange-500/10" />
                <StatCard icon={Images} label="Total memories" value={stats.totalMemories} accent="from-rose-500/15 to-pink-500/10" />
                <StatCard icon={BookHeart} label="Journal entries" value={stats.totalJournals} accent="from-purple-500/15 to-indigo-500/10" />
                <StatCard icon={Globe} label="Public vaults" value={stats.totalPublicVaults} accent="from-emerald-500/15 to-teal-500/10" />
                <StatCard icon={Clock} label="Sealed" value={stats.sealedVaults} accent="from-yellow-500/15 to-amber-500/10" />
                <StatCard icon={Sparkles} label="Unlocked" value={stats.unlockedVaults} accent="from-orange-500/15 to-red-500/10" />
                <StatCard icon={Images} label="Albums" value={stats.totalAlbums} accent="from-cyan-500/15 to-blue-500/10" />
              </div>

              <div className="bg-card border border-border/60 rounded-3xl p-6">
                <h2 className="font-display text-lg font-semibold mb-4">Recent signups</h2>
                {stats.recentSignups.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No users yet.</p>
                ) : (
                  <div className="space-y-2">
                    {stats.recentSignups.map((u) => (
                      <div key={u.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted/40">
                        <div className="size-9 rounded-full bg-gradient-to-br from-primary to-accent grid place-items-center text-primary-foreground font-semibold text-xs">
                          {u.avatar ? (
                            <img src={u.avatar} alt="" className="w-full h-full object-cover rounded-full" />
                          ) : (
                            u.name?.[0]?.toUpperCase() || "?"
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{u.name}</div>
                          <div className="text-xs text-muted-foreground truncate">{u.email}</div>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatShortDate(u.createdAt)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {tab === "users" && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
              {users.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">No users yet.</div>
              ) : (
                users.map((u) => (
                  <div key={u.id} className="flex items-center gap-3 p-3 rounded-2xl bg-card border border-border/60">
                    <div className="size-10 rounded-full bg-gradient-to-br from-primary to-accent grid place-items-center text-primary-foreground font-semibold text-sm shrink-0 overflow-hidden">
                      {u.avatar ? (
                        <img src={u.avatar} alt="" className="w-full h-full object-cover" />
                      ) : (
                        u.name?.[0]?.toUpperCase() || "?"
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate flex items-center gap-2">
                        {u.name}
                        {u.role === "ADMIN" && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-destructive/15 text-destructive text-[9px] font-bold uppercase">
                            <Shield className="size-2" /> Admin
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground truncate flex items-center gap-1">
                        <Mail className="size-2.5" /> {u.email}
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">
                        {u._count.vaults} vaults · {u._count.albums} albums · {u._count.journals} journals · joined {formatShortDate(u.createdAt)}
                      </div>
                    </div>
                    {u.role !== "ADMIN" && (
                      <button
                        onClick={() => handleDeleteUser(u.id, u.name)}
                        className="size-8 grid place-items-center rounded-full hover:bg-destructive hover:text-white text-muted-foreground transition-colors"
                        aria-label="Delete user"
                        title="Delete user"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    )}
                  </div>
                ))
              )}
            </motion.div>
          )}

          {tab === "vaults" && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
              {vaults.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">No vaults yet.</div>
              ) : (
                vaults.map((v) => (
                  <div key={v.id} className="rounded-2xl bg-card border border-border/60 p-4">
                    <div className="flex items-start gap-3">
                      <div className="size-12 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 grid place-items-center overflow-hidden shrink-0">
                        {v.coverImage ? (
                          <img src={v.coverImage} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <Lock className="size-5 text-accent" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <div className="font-medium text-sm">{v.title}</div>
                          {v.isPublic && (
                            <span className="px-1.5 py-0.5 rounded-full bg-blue-500/15 text-blue-600 text-[9px] font-medium">PUBLIC</span>
                          )}
                          <span className={cn(
                            "px-1.5 py-0.5 rounded-full text-[9px] font-medium",
                            v.isSealed ? "bg-amber-500/15 text-amber-600" : "bg-emerald-500/15 text-emerald-600"
                          )}>
                            {v.isSealed ? "SEALED" : "UNLOCKED"}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          by <span className="font-medium">{v.user.name}</span> ({v.user.email}) · {v.memories.length} memories · unlocks {formatShortDate(v.unlockAt)}
                        </div>
                        {v.description && (
                          <div className="text-xs text-muted-foreground mt-1 line-clamp-2">{v.description}</div>
                        )}
                      </div>
                      <button
                        onClick={() => handleDeleteVault(v.id, v.title)}
                        className="size-8 grid place-items-center rounded-full hover:bg-destructive hover:text-white text-muted-foreground transition-colors shrink-0"
                        aria-label="Delete vault"
                        title="Delete vault"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                    {v.memories.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-border/60">
                        <div className="text-[10px] text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1">
                          <AlertTriangle className="size-3 text-amber-500" />
                          Memories (admin can remove individually)
                        </div>
                        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                          {v.memories.map((m) => (
                            <div key={m.id} className="relative aspect-square rounded-md overflow-hidden bg-muted group">
                              {m.type === "VIDEO" ? (
                                <video src={m.url} className="w-full h-full object-cover" muted />
                              ) : (
                                <img src={m.url} alt="" className="w-full h-full object-cover" />
                              )}
                              <button
                                onClick={() => handleDeleteMemory(v.id, m.id)}
                                className="absolute top-0.5 right-0.5 size-4 grid place-items-center rounded-full bg-destructive text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                aria-label="Delete memory"
                              >
                                <Trash2 className="size-2" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </motion.div>
          )}

          {tab === "reviews" && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
              {reviews.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">No reviews yet.</div>
              ) : (
                reviews.map((r) => (
                  <div key={r.id} className="flex items-start gap-3 p-4 rounded-2xl bg-card border border-border/60">
                    <div className="size-10 rounded-full bg-gradient-to-br from-primary to-accent grid place-items-center text-primary-foreground font-semibold text-sm shrink-0 overflow-hidden">
                      {r.user.avatar ? (
                        <img src={r.user.avatar} alt="" className="w-full h-full object-cover" />
                      ) : (
                        r.user.name?.[0]?.toUpperCase() || "?"
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="text-sm font-medium">{r.user.name}</div>
                        <div className="flex items-center gap-0.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={cn(
                                "size-3",
                                i < r.rating
                                  ? "fill-accent text-accent"
                                  : "fill-transparent text-muted-foreground/30"
                              )}
                            />
                          ))}
                        </div>
                        <span className={cn(
                          "px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase",
                          r.isApproved
                            ? "bg-emerald-500/15 text-emerald-600"
                            : "bg-amber-500/15 text-amber-600"
                        )}>
                          {r.isApproved ? "Approved" : "Pending"}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {r.user.email} · {formatShortDate(r.createdAt)}
                      </div>
                      {r.comment && (
                        <div className="text-sm text-muted-foreground mt-2 font-serif italic line-clamp-3">
                          &ldquo;{r.comment}&rdquo;
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-1.5 shrink-0">
                      {!r.isApproved ? (
                        <button
                          onClick={() => handleApproveReview(r.id, true)}
                          className="px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-600 text-[10px] font-medium hover:bg-emerald-500/25 transition-colors"
                        >
                          Approve
                        </button>
                      ) : (
                        <button
                          onClick={() => handleApproveReview(r.id, false)}
                          className="px-3 py-1 rounded-full bg-muted text-muted-foreground text-[10px] font-medium hover:bg-muted/80 transition-colors"
                        >
                          Unapprove
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteReview(r.id)}
                        className="size-7 grid place-items-center rounded-full hover:bg-destructive hover:text-white text-muted-foreground transition-colors mx-auto"
                        aria-label="Delete review"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </motion.div>
          )}
        </>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, accent }: { icon: React.ElementType; label: string; value: number; accent: string }) {
  return (
    <div className="relative p-4 rounded-2xl bg-card border border-border/60 overflow-hidden">
      <div className={`absolute -top-6 -right-6 size-16 rounded-full bg-gradient-to-br ${accent} blur-xl`} />
      <div className="relative">
        <Icon className="size-4 text-accent mb-2" />
        <div className="font-display text-2xl font-semibold">{value}</div>
        <div className="text-[10px] text-muted-foreground mt-0.5">{label}</div>
      </div>
    </div>
  );
}
