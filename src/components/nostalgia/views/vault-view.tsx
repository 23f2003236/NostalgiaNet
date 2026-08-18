"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Lock,
  Plus,
  Globe,
  Loader2,
  Upload,
  X,
  Image as ImageIcon,
  Video,
  Sparkles,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import { api, Vault } from "@/lib/api";
import { useSession } from "next-auth/react";
import { VaultCard, VaultDetail } from "@/components/nostalgia/vault-card";
import { ShareVaultModal } from "@/components/nostalgia/share-vault-modal";
import { toDatetimeLocal } from "@/lib/format";
import { cn } from "@/lib/utils";

type Tab = "mine" | "public" | "shared";

export function VaultView() {
  const { data: session } = useSession();
  const user = session?.user;
  const [tab, setTab] = useState<Tab>("mine");
  const [vaults, setVaults] = useState<Vault[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [selected, setSelected] = useState<Vault | null>(null);
  const [sharing, setSharing] = useState<Vault | null>(null);

  useEffect(() => {
    let active = true;
    if (!user) return;
    const run = async () => {
      try {
        const r = await api.vaults.list(tab);
        if (active) {
          setVaults(r.vaults || []);
          setLoading(false);
        }
      } catch {
        if (active) {
          toast.error("Could not load vaults");
          setLoading(false);
        }
      }
    };
    run();
    return () => { active = false; };
  }, [tab, user]);

  const handleDelete = async (id: string) => {
    if (!user) return;
    try {
      await api.vaults.delete(id);
      setVaults((prev) => prev.filter((v) => v.id !== id));
      toast.success("Vault deleted");
    } catch {
      toast.error("Could not delete vault");
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <div className="text-sm text-muted-foreground mb-1 flex items-center gap-2">
            <Lock className="size-3.5 text-accent" />
            <span>TimeVaults</span>
          </div>
          <h1 className="font-display text-3xl lg:text-4xl font-semibold tracking-tight">
            Your sealed <span className="text-gradient-warm italic">moments</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Capsules locked away until the day they're meant to be opened.
          </p>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-primary-foreground font-medium text-sm shadow-warm hover:shadow-glow transition-all hover:-translate-y-0.5"
        >
          <Plus className="size-4" />
          New capsule
        </button>
      </div>

      {/* Tabs */}
      <div className="inline-flex p-1 rounded-full bg-muted/60 border border-border/60 mb-6">
        {([
          { key: "mine", label: "My capsules" },
          { key: "shared", label: "Shared with me" },
          { key: "public", label: "Public" },
        ] as { key: Tab; label: string }[]).map((t) => (
          <button
            key={t.key}
            onClick={() => { setTab(t.key); setLoading(true); }}
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

      {/* Grid */}
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
        <EmptyVaults onCreate={() => setCreating(true)} tab={tab} />
      ) : (
        <motion.div layout className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <AnimatePresence>
            {vaults.map((v) => (
              <VaultCard
                key={v.id}
                vault={v}
                onDelete={tab === "mine" && v._role !== "contributor" ? () => handleDelete(v.id) : undefined}
                onShare={tab === "mine" && v._role !== "contributor" ? () => setSharing(v) : undefined}
                onOpen={() => setSelected(v)}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Create modal */}
      <AnimatePresence>
        {creating && (
          <CreateVaultModal
            onClose={() => setCreating(false)}
            onCreated={(v) => {
              // Mark the newly-created vault as owned by the current user,
              // so VaultDetail shows the owner-only buttons (Add memories, etc.)
              setVaults((prev) => [{ ...v, _role: "owner" as const }, ...prev]);
              setCreating(false);
              toast.success(`"${v.title}" is sealed. Set your calendar.`);
            }}
          />
        )}
      </AnimatePresence>

      {/* Detail modal */}
      <AnimatePresence>
        {selected && (
          <VaultDetail vault={selected} onClose={() => setSelected(null)} />
        )}
      </AnimatePresence>

      {/* Share modal */}
      <AnimatePresence>
        {sharing && (
          <ShareVaultModal vault={sharing} onClose={() => setSharing(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}

function EmptyVaults({ onCreate, tab }: { onCreate: () => void; tab: Tab }) {
  return (
    <div className="text-center py-20 px-6 rounded-3xl border border-dashed border-border/60 bg-muted/30">
      <div className="size-16 mx-auto mb-4 rounded-2xl bg-card border border-border/60 grid place-items-center">
        <Lock className="size-7 text-accent" />
      </div>
      <h3 className="font-display text-xl font-semibold mb-1">
        {tab === "mine" && "Your first capsule awaits"}
        {tab === "shared" && "No shared capsules yet"}
        {tab === "public" && "Nothing here yet"}
      </h3>
      <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
        {tab === "mine" && "Capture photos, videos, and notes into a sealed vault. Pick a future unlock date. Watch time do its magic."}
        {tab === "shared" && "When a friend shares a capsule with you, it will appear here."}
        {tab === "public" && "Public capsules from the community will appear here."}
      </p>
      {tab === "mine" && (
        <button
          onClick={onCreate}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-primary-foreground font-medium text-sm shadow-warm hover:shadow-glow transition-all"
        >
          <Plus className="size-4" />
          Seal your first capsule
        </button>
      )}
    </div>
  );
}

function CreateVaultModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (vault: Vault) => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [unlockAt, setUnlockAt] = useState(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    return toDatetimeLocal(d);
  });
  const [isPublic, setIsPublic] = useState(false);
  const [category, setCategory] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [uploaded, setUploaded] = useState<{ url: string; type: string; caption?: string }[]>([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const handleFiles = async (newFiles: File[]) => {
    if (!newFiles.length) return;
    setUploading(true);
    try {
      const result = await api.upload(newFiles);
      setUploaded((prev) => [
        ...prev,
        ...result.files.map((f) => ({ url: f.url, type: f.type })),
      ]);
      setFiles((prev) => [...prev, ...newFiles]);
      toast.success(`${newFiles.length} file${newFiles.length > 1 ? "s" : ""} added`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error("Give your capsule a title");
      return;
    }
    if (!unlockAt) {
      toast.error("Pick an unlock date");
      return;
    }
    if (new Date(unlockAt) <= new Date()) {
      toast.error("Unlock date must be in the future");
      return;
    }
    setSaving(true);
    try {
      const cover = uploaded.find((m) => m.type === "IMAGE")?.url || null;
      const result = await api.vaults.create({
        title,
        description,
        coverImage: cover,
        unlockAt: new Date(unlockAt).toISOString(),
        isPublic,
        category: category || undefined,
        memories: uploaded.map((m) => ({ type: m.type, url: m.url })),
      });
      onCreated(result.vault);
    } catch (e) {
      toast.error("Could not create vault");
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[90] grid place-items-center p-4"
    >
      <div className="absolute inset-0 bg-background/70 backdrop-blur-md" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        className="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto bg-card border border-border/60 rounded-3xl shadow-warm"
      >
        <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-primary via-accent to-primary opacity-70" />
        <button onClick={onClose} className="absolute top-4 right-4 size-8 grid place-items-center rounded-full hover:bg-muted z-10" aria-label="Close">
          <X className="size-4" />
        </button>

        <div className="p-6 lg:p-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Sparkles className="size-3.5 text-accent" />
            <span>Seal a new TimeVault</span>
          </div>
          <h2 className="font-display text-2xl font-semibold mb-6">
            What will future-you remember?
          </h2>

          <div className="space-y-4">
            {/* Title */}
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Summer of 2026, Letter to 30-year-old me"
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/15 text-sm transition-all"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                A note to your future self (optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Write a few words about why you're sealing this capsule..."
                rows={3}
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/15 text-sm transition-all resize-none font-serif"
              />
            </div>

            {/* Upload */}
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                Photos & videos
              </label>
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  handleFiles(Array.from(e.dataTransfer.files));
                }}
                className={cn(
                  "relative rounded-2xl border-2 border-dashed p-6 text-center transition-all",
                  dragOver
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/40 bg-muted/30"
                )}
              >
                <input
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  onChange={(e) => e.target.files && handleFiles(Array.from(e.target.files))}
                />
                <Upload className="size-7 text-accent mx-auto mb-2" />
                <p className="text-sm font-medium">
                  {uploading ? "Uploading..." : "Drag & drop or click to upload"}
                </p>
                <p className="text-[10px] text-muted-foreground mt-1">
                  JPG, PNG, WebP, MP4 · up to 8 MB each
                </p>
              </div>

              {uploaded.length > 0 && (
                <div className="mt-3 grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {uploaded.map((m, i) => (
                    <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-muted group">
                      {m.type === "VIDEO" ? (
                        <video src={m.url} className="w-full h-full object-cover" muted />
                      ) : (
                        <img src={m.url} alt="" className="w-full h-full object-cover" />
                      )}
                      <button
                        onClick={() => setUploaded((prev) => prev.filter((_, j) => j !== i))}
                        className="absolute top-1 right-1 size-5 grid place-items-center rounded-full bg-destructive text-white opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="size-3" />
                      </button>
                      <div className="absolute bottom-1 left-1 size-4 grid place-items-center rounded-full bg-black/60">
                        {m.type === "VIDEO" ? <Video className="size-2.5 text-white" /> : <ImageIcon className="size-2.5 text-white" />}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Unlock date */}
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                Unlock date
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="datetime-local"
                  value={unlockAt}
                  onChange={(e) => setUnlockAt(e.target.value)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-border bg-background focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/15 text-sm"
                />
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {[
                  { label: "1 month", months: 1 },
                  { label: "6 months", months: 6 },
                  { label: "1 year", months: 12 },
                  { label: "5 years", months: 60 },
                  { label: "10 years", months: 120 },
                ].map((preset) => (
                  <button
                    key={preset.label}
                    onClick={() => {
                      const d = new Date();
                      d.setMonth(d.getMonth() + preset.months);
                      setUnlockAt(toDatetimeLocal(d));
                    }}
                    className="px-3 py-1 rounded-full bg-muted hover:bg-primary/10 hover:text-primary text-xs transition-colors"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                Category (optional — helps discovery in the public feed)
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  { key: "travel", label: "Travel" },
                  { key: "family", label: "Family" },
                  { key: "friendship", label: "Friendship" },
                  { key: "milestones", label: "Milestones" },
                  { key: "letters", label: "Letters" },
                  { key: "music", label: "Music" },
                ].map((c) => (
                  <button
                    key={c.key}
                    onClick={() => setCategory(category === c.key ? "" : c.key)}
                    className={cn(
                      "px-3 py-1 rounded-full text-xs font-medium border transition-all",
                      category === c.key
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-border hover:border-primary/40 text-muted-foreground"
                    )}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Public toggle */}
            <label className="flex items-start gap-3 p-3 rounded-xl border border-border hover:border-primary/30 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="mt-0.5 accent-primary"
              />
              <div>
                <div className="text-sm font-medium flex items-center gap-2">
                  <Globe className="size-3.5 text-accent" />
                  Make this capsule public
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  Others can preview the cover, but contents stay sealed until the unlock date.
                </div>
              </div>
            </label>
          </div>

          <div className="flex items-center justify-between gap-3 mt-6 pt-6 border-t border-border/60">
            <div className="text-xs text-muted-foreground flex items-center gap-2">
              <Clock className="size-3.5" />
              Once sealed, contents cannot be opened before {new Date(unlockAt).toLocaleDateString()}.
            </div>
            <div className="flex items-center gap-2">
              <button onClick={onClose} className="px-4 py-2 rounded-full text-sm hover:bg-muted">
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving || uploading}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-primary text-primary-foreground text-sm font-medium shadow-warm hover:shadow-glow transition-all disabled:opacity-60"
              >
                {saving ? (
                  <><Loader2 className="size-4 animate-spin" /> Sealing...</>
                ) : (
                  <><Lock className="size-4" /> Seal capsule</>
                )}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
