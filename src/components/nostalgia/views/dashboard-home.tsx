"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Lock,
  BookHeart,
  Users,
  CalendarHeart,
  Sparkles,
  ArrowUpRight,
  Clock,
  TrendingUp,
  Link2,
  Check,
} from "lucide-react";
import { api, Vault, Journal } from "@/lib/api";
import { useSession } from "next-auth/react";
import type { ViewKey } from "@/components/nostalgia/app-shell";
import { formatCountdown } from "@/lib/format";

export function DashboardHome({ onNavigate }: { onNavigate: (v: ViewKey) => void }) {
  const { data: session } = useSession();
  const user = session?.user;
  const [vaults, setVaults] = useState<Vault[]>([]);
  const [journals, setJournals] = useState<Journal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    if (!user) return;
    const run = async () => {
      try {
        const [vRes, jRes] = await Promise.all([
          api.vaults.list("mine").catch(() => ({ vaults: [] })),
          api.journals.list().catch(() => ({ journals: [] })),
        ]);
        if (!active) return;
        setVaults((vRes as { vaults: Vault[] }).vaults || []);
        setJournals((jRes as { journals: Journal[] }).journals || []);
        setLoading(false);
      } catch {
        if (active) setLoading(false);
      }
    };
    run();
    return () => { active = false; };
  }, [user]);

  const totalMemories = vaults.reduce(
    (acc, v) => acc + (v.memories?.length || 0),
    0
  );
  const upcoming = vaults
    .filter((v) => new Date(v.unlockAt) > new Date())
    .sort((a, b) => new Date(a.unlockAt).getTime() - new Date(b.unlockAt).getTime());
  const nextUnlock = upcoming[0];
  const sealedCount = vaults.filter((v) => new Date(v.unlockAt) > new Date()).length;
  const unlockedCount = vaults.length - sealedCount;

  const hour = new Date().getHours();
  const greeting =
    hour < 5 ? "Burning the midnight oil" :
    hour < 12 ? "Good morning" :
    hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Hero greeting */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl p-6 lg:p-8 bg-gradient-to-br from-primary/10 via-accent/10 to-primary/5 border border-border/60"
      >
        <div className="absolute -top-12 -right-12 size-48 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 blur-3xl" />
        <div className="relative">
          <div className="text-sm text-muted-foreground mb-1 flex items-center gap-2">
            <Sparkles className="size-3.5 text-accent" />
            <span>{greeting},</span>
          </div>
          <h1 className="font-display text-3xl lg:text-4xl font-semibold tracking-tight">
            {user?.name?.split(" ")[0] || "Memory-keeper"}
          </h1>
          <p className="mt-2 text-muted-foreground font-serif text-sm lg:text-base max-w-xl">
            {nextUnlock ? (
              <>
                Your next capsule{" "}
                <span className="font-medium text-foreground">
                  &ldquo;{nextUnlock.title}&rdquo;
                </span>{" "}
                unlocks in{" "}
                <span className="text-gradient-warm font-semibold">
                  {formatCountdown(nextUnlock.unlockAt)}
                </span>
                .
              </>
            ) : (
              "Create your first TimeVault and seal a moment for your future self."
            )}
          </p>
        </div>
      </motion.div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Lock} label="Active capsules" value={String(sealedCount)} accent="from-amber-500/15 to-orange-500/10" />
        <StatCard icon={Sparkles} label="Unlocked" value={String(unlockedCount)} accent="from-rose-500/15 to-amber-500/10" />
        <StatCard icon={BookHeart} label="Journal entries" value={String(journals.length)} accent="from-orange-500/15 to-yellow-500/10" />
        <StatCard icon={CalendarHeart} label="Memories stored" value={String(totalMemories)} accent="from-amber-600/15 to-rose-500/10" />
      </div>

      {/* Quick actions */}
      <div className="grid md:grid-cols-3 gap-4">
        <QuickAction icon={Lock} title="Seal a TimeVault" desc="Upload photos, pick an unlock date, and let time do the rest." cta="Create" onClick={() => onNavigate("vaults")} accent="text-amber-600" />
        <QuickAction icon={BookHeart} title="Write in your journal" desc="Capture today's mood, weather, and a thought or two." cta="Write" onClick={() => onNavigate("journals")} accent="text-rose-600" />
        <QuickAction icon={Users} title="Remember with friends" desc="Invite someone to share a capsule and open it together." cta="Invite" onClick={() => onNavigate("friends")} accent="text-orange-600" />
      </div>

      {/* Referral banner */}
      {user?.id && <ReferralBanner userId={user.id} />}

      {/* Upcoming + Recent */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <SectionHeader icon={Clock} title="Awaiting their day" action={
            <button onClick={() => onNavigate("vaults")} className="text-xs text-primary inline-flex items-center gap-1 hover:underline">
              See all <ArrowUpRight className="size-3" />
            </button>
          } />
          <div className="space-y-3">
            {loading ? <SkeletonList /> : upcoming.length === 0 ? (
              <EmptyState icon={Lock} title="No sealed capsules yet" desc="Your future awaits your first TimeVault." actionLabel="Create one" onAction={() => onNavigate("vaults")} />
            ) : (
              upcoming.slice(0, 4).map((v) => <VaultRow key={v.id} vault={v} />)
            )}
          </div>
        </div>
        <div>
          <SectionHeader icon={BookHeart} title="Recent reflections" action={
            <button onClick={() => onNavigate("journals")} className="text-xs text-primary inline-flex items-center gap-1 hover:underline">
              See all <ArrowUpRight className="size-3" />
            </button>
          } />
          <div className="space-y-3">
            {loading ? <SkeletonList /> : journals.length === 0 ? (
              <EmptyState icon={BookHeart} title="No entries yet" desc="Your first reflection begins now." actionLabel="Write" onAction={() => onNavigate("journals")} />
            ) : (
              journals.slice(0, 3).map((j) => <JournalRow key={j.id} journal={j} />)
            )}
          </div>
        </div>
      </div>

      {/* Memory trend */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="rounded-3xl p-6 border border-border/60 bg-card">
        <div className="flex items-center gap-2 mb-1">
          <TrendingUp className="size-4 text-accent" />
          <h3 className="font-display text-lg font-semibold">Your memory footprint</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-5">
          A glance at how your collection grows over time.
        </p>
        <FootprintChart vaults={vaults} journals={journals} />
      </motion.div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, accent }: { icon: React.ElementType; label: string; value: string; accent: string }) {
  return (
    <div className="relative p-5 rounded-2xl bg-card border border-border/60 overflow-hidden">
      <div className={`absolute -top-8 -right-8 size-24 rounded-full bg-gradient-to-br ${accent} blur-2xl`} />
      <div className="relative">
        <Icon className="size-5 text-accent mb-3" />
        <div className="font-display text-3xl font-semibold">{value}</div>
        <div className="text-xs text-muted-foreground mt-1">{label}</div>
      </div>
    </div>
  );
}

function QuickAction({ icon: Icon, title, desc, cta, onClick, accent }: { icon: React.ElementType; title: string; desc: string; cta: string; onClick: () => void; accent: string }) {
  return (
    <motion.button whileHover={{ y: -2 }} onClick={onClick} className="group text-left p-5 rounded-2xl bg-card border border-border/60 hover:border-primary/30 hover:shadow-warm transition-all">
      <Icon className={`size-5 mb-3 ${accent}`} />
      <h3 className="font-display text-lg font-semibold mb-1">{title}</h3>
      <p className="text-xs text-muted-foreground leading-relaxed mb-4">{desc}</p>
      <span className="inline-flex items-center gap-1 text-xs font-medium text-primary group-hover:gap-2 transition-all">
        {cta} <ArrowUpRight className="size-3" />
      </span>
    </motion.button>
  );
}

function SectionHeader({ icon: Icon, title, action }: { icon: React.ElementType; title: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        <Icon className="size-4 text-accent" />
        <h3 className="font-display text-lg font-semibold">{title}</h3>
      </div>
      {action}
    </div>
  );
}

function VaultRow({ vault }: { vault: Vault }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border/60 hover:border-primary/30 transition-colors">
      <div className="size-12 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 grid place-items-center overflow-hidden shrink-0">
        {vault.coverImage ? (
          <img src={vault.coverImage} alt="" className="w-full h-full object-cover" />
        ) : (
          <Lock className="size-5 text-accent" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm truncate">{vault.title}</div>
        <div className="text-xs text-muted-foreground">
          Unlocks {new Date(vault.unlockAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
        </div>
      </div>
      <div className="text-right">
        <div className="text-xs font-medium text-gradient-warm">{formatCountdown(vault.unlockAt)}</div>
        <div className="text-[10px] text-muted-foreground">remaining</div>
      </div>
    </div>
  );
}

function JournalRow({ journal }: { journal: Journal }) {
  return (
    <div className="p-3 rounded-xl bg-card border border-border/60 hover:border-primary/30 transition-colors">
      <div className="flex items-center justify-between mb-1">
        <div className="font-medium text-sm truncate">{journal.title}</div>
        {journal.mood && (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/10 text-accent">
            {journal.mood.toLowerCase()}
          </span>
        )}
      </div>
      <div className="text-xs text-muted-foreground line-clamp-2">{journal.content}</div>
      <div className="text-[10px] text-muted-foreground mt-2">
        {new Date(journal.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
      </div>
    </div>
  );
}

function EmptyState({ icon: Icon, title, desc, actionLabel, onAction }: { icon: React.ElementType; title: string; desc: string; actionLabel: string; onAction: () => void }) {
  return (
    <div className="text-center py-10 px-4 rounded-2xl border border-dashed border-border/60 bg-muted/30">
      <div className="size-12 mx-auto rounded-full bg-card border border-border/60 grid place-items-center mb-3">
        <Icon className="size-5 text-muted-foreground" />
      </div>
      <div className="font-medium text-sm">{title}</div>
      <div className="text-xs text-muted-foreground mt-1 mb-4">{desc}</div>
      <button onClick={onAction} className="px-4 py-2 rounded-full bg-primary text-primary-foreground text-xs font-medium shadow-warm hover:shadow-glow transition-all">
        {actionLabel}
      </button>
    </div>
  );
}

function SkeletonList() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-16 rounded-xl bg-muted/50 animate-pulse" />
      ))}
    </div>
  );
}

function FootprintChart({ vaults, journals }: { vaults: Vault[]; journals: Journal[] }) {
  const months: { label: string; vaults: number; journals: number }[] = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = d.toLocaleDateString(undefined, { month: "short" });
    const vCount = vaults.filter((v) => {
      const vd = new Date(v.createdAt);
      return vd.getMonth() === d.getMonth() && vd.getFullYear() === d.getFullYear();
    }).length;
    const jCount = journals.filter((j) => {
      const jd = new Date(j.createdAt);
      return jd.getMonth() === d.getMonth() && jd.getFullYear() === d.getFullYear();
    }).length;
    months.push({ label, vaults: vCount, journals: jCount });
  }
  const maxVal = Math.max(1, ...months.map((m) => m.vaults + m.journals));

  return (
    <div className="flex items-end justify-between gap-3 h-32">
      {months.map((m) => {
        const total = m.vaults + m.journals;
        const heightPct = (total / maxVal) * 100;
        const vaultPct = total > 0 ? (m.vaults / total) * 100 : 0;
        return (
          <div key={m.label} className="flex-1 flex flex-col items-center gap-2">
            <div className="w-full flex-1 flex flex-col justify-end">
              <div className="w-full rounded-t-md overflow-hidden bg-muted/40 relative" style={{ height: `${heightPct}%`, minHeight: 4 }}>
                <div className="w-full bg-gradient-to-t from-primary to-accent" style={{ height: `${100 - vaultPct}%` }} />
                <div className="w-full bg-gradient-to-t from-accent to-amber-300" style={{ height: `${vaultPct}%` }} />
              </div>
            </div>
            <div className="text-[10px] text-muted-foreground">{m.label}</div>
          </div>
        );
      })}
    </div>
  );
}

function ReferralBanner({ userId }: { userId: string }) {
  const [copied, setCopied] = useState(false);
  const refUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/?ref=${userId}`
      : `/?ref=${userId}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(refUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // ignore
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="relative overflow-hidden rounded-3xl p-6 lg:p-7 bg-gradient-to-br from-accent/15 via-primary/10 to-accent/10 border border-accent/30"
    >
      <div className="absolute -top-12 -right-12 size-40 rounded-full bg-gradient-to-br from-accent/30 to-primary/20 blur-3xl" />
      <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="size-11 rounded-2xl bg-card border border-border/60 grid place-items-center shrink-0">
            <Sparkles className="size-5 text-accent" />
          </div>
          <div>
            <h3 className="font-display text-base font-semibold mb-1">
              Invite a friend — your capsule unlocks 3 days earlier
            </h3>
            <p className="text-xs text-muted-foreground max-w-md">
              Share your referral link. When someone signs up with it, the
              unlock date on your oldest sealed vault moves up by 3 days.
            </p>
          </div>
        </div>
        <button
          onClick={handleCopy}
          className="shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-card border border-border hover:border-accent/40 text-xs font-medium transition-all"
        >
          {copied ? (
            <>
              <Check className="size-3.5 text-accent" />
              <span className="text-accent">Copied!</span>
            </>
          ) : (
            <>
              <Link2 className="size-3.5" />
              <span>Copy referral link</span>
            </>
          )}
        </button>
      </div>
    </motion.div>
  );
}
