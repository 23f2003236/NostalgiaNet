"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Lock,
  Unlock,
  Sparkles,
  Clock,
  Image as ImageIcon,
  Video,
  Heart,
  Share2,
  ArrowRight,
  Calendar,
  User,
  Download,
} from "lucide-react";
import { Logo } from "@/components/icons/logo";
import { formatCountdown, formatDate } from "@/lib/format";

type Memory = {
  id: string;
  type: string;
  url: string;
  caption: string | null;
};

type PublicVault = {
  id: string;
  title: string;
  description: string | null;
  coverImage: string | null;
  unlockAt: string;
  createdAt: string;
  category: string | null;
  isSealed: boolean;
  user: { name: string; avatar: string | null };
  memories: Memory[];
  memoriesCount?: number;
};

export function PublicVaultView({ vault }: { vault: PublicVault }) {
  const isUnlocked = new Date(vault.unlockAt) <= new Date();

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="sticky top-0 z-30 glass-dark border-b border-border/60">
        <div className="container mx-auto px-4 lg:px-8 py-3 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2.5">
            <Logo className="size-8" />
            <span className="font-display text-lg font-semibold">
              Nostalgia<span className="text-accent">Net</span>
            </span>
          </a>
          <div className="flex items-center gap-2">
            <ShareCardButton vaultId={vault.id} title={vault.title} />
            <a
              href="/?auth=signup"
              className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-primary text-primary-foreground text-sm font-medium shadow-warm hover:shadow-glow transition-all"
            >
              <Sparkles className="size-3.5" />
              Make your own
            </a>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 lg:px-8 py-8 lg:py-12 max-w-5xl">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative rounded-3xl overflow-hidden mb-8"
        >
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
            <div className="flex items-center gap-2 mb-3">
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium backdrop-blur-md inline-flex items-center gap-1 ${
                isUnlocked ? "bg-accent text-accent-foreground" : "bg-black/60"
              }`}>
                {isUnlocked ? (
                  <><Unlock className="size-2.5" /> Unlocked</>
                ) : (
                  <><Lock className="size-2.5" /> Sealed</>
                )}
              </span>
              {vault.category && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-black/60 backdrop-blur-md capitalize">
                  {vault.category}
                </span>
              )}
            </div>
            <h1 className="font-display text-3xl lg:text-5xl font-semibold leading-tight drop-shadow-md">
              {vault.title}
            </h1>
            {vault.description && (
              <p className="mt-2 text-sm lg:text-base text-white/85 font-serif max-w-2xl">
                {vault.description}
              </p>
            )}
          </div>
        </motion.div>

        {/* Meta row */}
        <div className="grid sm:grid-cols-3 gap-4 mb-8">
          <MetaCard
            icon={User}
            label="Sealed by"
            value={vault.user.name}
            avatar={vault.user.avatar}
          />
          <MetaCard
            icon={Calendar}
            label={isUnlocked ? "Unlocked on" : "Unlocks on"}
            value={formatDate(vault.unlockAt)}
          />
          <MetaCard
            icon={Clock}
            label={isUnlocked ? "Time passed" : "Time remaining"}
            value={isUnlocked ? "Now open" : formatCountdown(vault.unlockAt)}
            accent
          />
        </div>

        {/* Body */}
        {isUnlocked ? (
          <div className="mb-12">
            <h2 className="font-display text-2xl font-semibold mb-4 flex items-center gap-2">
              <Sparkles className="size-5 text-accent" />
              Memories inside
            </h2>
            {vault.memories.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                This capsule was empty.
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                {vault.memories.map((m) => (
                  <div
                    key={m.id}
                    className="rounded-2xl overflow-hidden border border-border/60 group"
                  >
                    {m.type === "VIDEO" ? (
                      <video
                        src={m.url}
                        controls
                        className="w-full aspect-square object-cover bg-black"
                      />
                    ) : (
                      <img
                        src={m.url}
                        alt={m.caption || ""}
                        className="w-full aspect-square object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    )}
                    {m.caption && (
                      <div className="p-3 text-xs text-muted-foreground font-serif italic">
                        {m.caption}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="mb-12 text-center py-16 px-6 rounded-3xl border border-dashed border-border/60 bg-muted/30">
            <div className="size-20 mx-auto mb-4 rounded-full bg-card border border-border/60 grid place-items-center">
              <Lock className="size-9 text-accent animate-pulse-warm" />
            </div>
            <h2 className="font-display text-2xl font-semibold mb-2">
              Still sealed
            </h2>
            <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
              This capsule holds <span className="font-medium text-foreground">
                {vault.memoriesCount || vault.memories.length}
              </span>{" "}
              {vault.memoriesCount === 1 ? "memory" : "memories"}.
              They will be revealed in{" "}
              <span className="text-gradient-warm font-semibold">
                {formatCountdown(vault.unlockAt)}
              </span>.
            </p>
            <div className="max-w-sm mx-auto">
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <CountdownBar unlockAt={vault.unlockAt} createdAt={vault.createdAt} />
              </div>
            </div>
          </div>
        )}

        {/* CTA */}
        <CtaCard />
      </main>
    </div>
  );
}

export function PublicAlbumView({
  album,
}: {
  album: {
    id: string;
    title: string;
    description: string | null;
    coverImage: string | null;
    createdAt: string;
    user: { name: string; avatar: string | null };
    memories: Memory[];
  };
}) {
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
          <a
            href="/?auth=signup"
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-primary text-primary-foreground text-sm font-medium shadow-warm hover:shadow-glow transition-all"
          >
            <Sparkles className="size-3.5" />
            Make your own
          </a>
        </div>
      </header>

      <main className="container mx-auto px-4 lg:px-8 py-8 lg:py-12 max-w-5xl">
        <div className="mb-8">
          <div className="text-sm text-muted-foreground mb-2 flex items-center gap-2">
            <ImageIcon className="size-3.5 text-accent" />
            <span>Photo album</span>
          </div>
          <h1 className="font-display text-3xl lg:text-5xl font-semibold tracking-tight">
            {album.title}
          </h1>
          {album.description && (
            <p className="mt-2 text-muted-foreground font-serif text-base max-w-2xl">
              {album.description}
            </p>
          )}
          <div className="mt-4 flex items-center gap-3">
            <div className="size-8 rounded-full bg-gradient-to-br from-primary to-accent grid place-items-center text-primary-foreground font-semibold text-xs">
              {album.user.name?.[0]?.toUpperCase() || "U"}
            </div>
            <div className="text-sm text-muted-foreground">
              by <span className="font-medium text-foreground">{album.user.name}</span>
              {" · "}
              {album.memories.length} {album.memories.length === 1 ? "photo" : "photos"}
            </div>
          </div>
        </div>

        {album.memories.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            This album is empty.
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 mb-12">
            {album.memories.map((m) => (
              <div
                key={m.id}
                className="rounded-2xl overflow-hidden border border-border/60 group"
              >
                {m.type === "VIDEO" ? (
                  <video
                    src={m.url}
                    controls
                    className="w-full aspect-square object-cover bg-black"
                  />
                ) : (
                  <img
                    src={m.url}
                    alt={m.caption || ""}
                    className="w-full aspect-square object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                )}
                {m.caption && (
                  <div className="p-3 text-xs text-muted-foreground font-serif italic">
                    {m.caption}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <CtaCard />
      </main>
    </div>
  );
}

function MetaCard({
  icon: Icon,
  label,
  value,
  avatar,
  accent,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  avatar?: string | null;
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
          {avatar && (
            <span
              className="inline-block size-4 rounded-full bg-gradient-to-br from-primary to-accent align-middle mr-1.5 bg-cover bg-center"
              style={avatar ? { backgroundImage: `url(${avatar})` } : undefined}
            />
          )}
          {value}
        </div>
      </div>
    </div>
  );
}

function CountdownBar({ unlockAt, createdAt }: { unlockAt: string; createdAt: string }) {
  const start = new Date(createdAt).getTime();
  const end = new Date(unlockAt).getTime();
  const now = Date.now();
  const total = end - start;
  const elapsed = now - start;
  const [pct, setPct] = useState(() => Math.max(0, Math.min(100, (elapsed / total) * 100)));
  useEffect(() => {
    const t = setInterval(() => {
      const n = Date.now();
      setPct(Math.max(0, Math.min(100, ((n - start) / total) * 100)));
    }, 60000);
    return () => clearInterval(t);
  }, [unlockAt, createdAt]);
  return (
    <motion.div
      initial={{ width: 0 }}
      animate={{ width: `${pct}%` }}
      transition={{ duration: 1, ease: "easeOut" }}
      className="h-full bg-gradient-to-r from-primary to-accent"
    />
  );
}

function CtaCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="relative overflow-hidden rounded-3xl p-8 lg:p-12 bg-gradient-to-br from-primary/10 via-accent/10 to-primary/5 border border-border/60 text-center"
    >
      <div className="absolute -top-12 -right-12 size-48 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 blur-3xl" />
      <div className="relative">
        <div className="size-12 mx-auto mb-4 rounded-2xl bg-card border border-border/60 grid place-items-center">
          <Heart className="size-5 text-accent" />
        </div>
        <h2 className="font-display text-2xl lg:text-3xl font-semibold mb-2">
          Seal a moment of your own
        </h2>
        <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
          NostalgiaNet++ is a free, beautiful place to lock away memories and reopen
          them on the day they matter. Yours could be next.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <a
            href="/?auth=signup"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-primary-foreground font-medium shadow-warm hover:shadow-glow transition-all hover:-translate-y-0.5"
          >
            <Sparkles className="size-4" />
            Start your first capsule
            <ArrowRight className="size-4" />
          </a>
          <a
            href="/"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-full border border-border hover:border-primary/40 transition-colors text-sm"
          >
            Browse more
          </a>
        </div>
      </div>
    </motion.div>
  );
}

function ShareCardButton({ vaultId, title }: { vaultId: string; title: string }) {
  const [loading, setLoading] = useState(false);

  const handleShare = async () => {
    setLoading(true);
    try {
      const ogUrl = `/api/og/vault/${vaultId}`;
      const shareUrl = `${window.location.origin}/v/${vaultId}`;

      // Try native share first (mobile Safari/Chrome on iOS/Android, Telegram, WhatsApp web)
      if (navigator.share) {
        try {
          await navigator.share({
            title: `${title} — NostalgiaNet++`,
            text: `Check out this time capsule on NostalgiaNet++`,
            url: shareUrl,
          });
          return;
        } catch (err) {
          // user cancelled or share failed — fall through to download
        }
      }

      // Fallback: download the OG image directly
      const res = await fetch(ogUrl);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `nostalgianet-${vaultId}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("share failed", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleShare}
      disabled={loading}
      className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border hover:border-primary/40 transition-colors text-sm disabled:opacity-60"
      title="Share this capsule"
    >
      {loading ? (
        <Sparkles className="size-3.5 animate-pulse" />
      ) : (
        <Share2 className="size-3.5" />
      )}
      <span className="hidden sm:inline">Share</span>
    </button>
  );
}
