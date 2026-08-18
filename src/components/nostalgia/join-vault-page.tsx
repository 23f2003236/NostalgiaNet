"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useSession, signIn } from "next-auth/react";
import {
  Lock,
  Unlock,
  Sparkles,
  Clock,
  Users,
  Plus,
  Loader2,
  ArrowRight,
  Calendar,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { Logo } from "@/components/icons/logo";
import { formatCountdown, formatDate } from "@/lib/format";

type Props = {
  // Accept any Prisma-shaped vault object — we only read a few fields.
  // Using `any` here is intentional: the page.tsx is the only caller and
  // it controls the exact shape passed in.
  vault: any;
};

export function JoinVaultPage({ vault }: Props) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [joining, setJoining] = useState(false);
  const isUnlocked = new Date(vault.unlockAt) <= new Date();

  const handleJoin = async () => {
    if (status !== "authenticated") {
      // Sign up first, then the modal will reload
      signIn("google", { callbackUrl: `/join-vault/${vault.inviteToken}` });
      return;
    }
    setJoining(true);
    try {
      const res = await fetch("/api/vaults/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteToken: vault.inviteToken }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Could not join");
      }
      if (data.alreadyMember) {
        toast.success("You're already a contributor — taking you to the vault...");
      } else {
        toast.success("You've joined! Time to add your memories.");
      }
      setTimeout(() => {
        router.push("/?view=vaults");
      }, 1200);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not join");
    } finally {
      setJoining(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 glass-dark border-b border-border/60">
        <div className="container mx-auto px-4 lg:px-8 py-3 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2.5">
            <Logo className="size-8" />
            <span className="font-display text-lg font-semibold">
              Nostalgia<span className="text-accent">Net</span>
            </span>
          </a>
        </div>
      </header>

      <main className="container mx-auto px-4 lg:px-8 py-8 lg:py-12 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-4 rounded-full glass border border-border/60 text-xs font-medium text-muted-foreground">
            <Users className="size-3.5 text-accent" />
            <span>You've been invited to collaborate</span>
          </div>
        </motion.div>

        <div className="relative rounded-3xl overflow-hidden mb-8">
          {vault.coverImage ? (
            <img
              src={vault.coverImage}
              alt={vault.title}
              className="w-full aspect-[16/9] object-cover"
            />
          ) : (
            <div className="w-full aspect-[16/9] bg-gradient-to-br from-primary/20 via-accent/20 to-primary/10 grid place-items-center">
              <Lock className="size-16 text-accent/60" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          <div className="absolute bottom-0 inset-x-0 p-6 lg:p-8 text-white">
            <h1 className="font-display text-3xl lg:text-4xl font-semibold drop-shadow-md">
              {vault.title}
            </h1>
            {vault.description && (
              <p className="mt-2 text-sm text-white/85 font-serif max-w-2xl">
                {vault.description}
              </p>
            )}
          </div>
        </div>

        <div className="grid sm:grid-cols-3 gap-4 mb-8">
          <StatCard icon={Calendar} label="Sealed by" value={vault.user.name} />
          <StatCard
            icon={Clock}
            label={isUnlocked ? "Unlocked" : "Unlocks in"}
            value={isUnlocked ? "Now open" : formatCountdown(vault.unlockAt)}
            accent
          />
          <StatCard
            icon={Users}
            label="Contributors"
            value={String(vault.contributors.length + 1)}
          />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="relative overflow-hidden rounded-3xl p-6 lg:p-10 bg-gradient-to-br from-primary/10 via-accent/10 to-primary/5 border border-border/60 mb-6"
        >
          <div className="absolute -top-12 -right-12 size-48 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 blur-3xl" />
          <div className="relative">
            {isUnlocked ? (
              <>
                <h2 className="font-display text-2xl font-semibold mb-2">
                  This vault has already unlocked
                </h2>
                <p className="text-sm text-muted-foreground mb-6 max-w-lg">
                  It&apos;s too late to add new memories, but you can still
                  sign in to revisit what was sealed inside.
                </p>
                <button
                  onClick={handleJoin}
                  disabled={joining}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-primary-foreground font-medium shadow-warm hover:shadow-glow transition-all hover:-translate-y-0.5 disabled:opacity-60"
                >
                  {joining ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
                  Sign in to view
                </button>
              </>
            ) : (
              <>
                <h2 className="font-display text-2xl font-semibold mb-2">
                  Add your memories to this capsule
                </h2>
                <p className="text-sm text-muted-foreground mb-6 max-w-lg">
                  Once you join, you can upload photos and videos. They&apos;ll
                  stay sealed alongside everyone else&apos;s contributions until
                  the unlock date.
                </p>
                <button
                  onClick={handleJoin}
                  disabled={joining}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-primary-foreground font-medium shadow-warm hover:shadow-glow transition-all hover:-translate-y-0.5 disabled:opacity-60"
                >
                  {joining ? (
                    <><Loader2 className="size-4 animate-spin" /> Joining...</>
                  ) : status === "authenticated" ? (
                    <><Plus className="size-4" /> Join as contributor</>
                  ) : (
                    <><Sparkles className="size-4" /> Sign up to join</>
                  )}
                </button>
                {status === "authenticated" && (
                  <p className="text-xs text-muted-foreground mt-3">
                    Signed in as <span className="font-medium text-foreground">{session?.user?.name}</span>.
                  </p>
                )}
              </>
            )}
          </div>
        </motion.div>

        <div className="text-center">
          <a
            href="/"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowRight className="size-3 rotate-180" />
            Back to NostalgiaNet++
          </a>
        </div>
      </main>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="p-4 rounded-2xl bg-card border border-border/60 flex items-center gap-3">
      <div className={`size-10 rounded-xl grid place-items-center shrink-0 ${
        accent ? "bg-accent/15 text-accent" : "bg-muted text-muted-foreground"
      }`}>
        <Icon className="size-4" />
      </div>
      <div className="min-w-0">
        <div className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</div>
        <div className={`text-sm font-medium truncate ${accent ? "text-gradient-warm" : ""}`}>
          {value}
        </div>
      </div>
    </div>
  );
}
