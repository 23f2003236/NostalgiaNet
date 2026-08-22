"use client";

import { motion } from "framer-motion";
import { Lock, Unlock, Globe, Trash2, Clock, Image as ImageIcon, Video, Share2, Link2, Check, UserPlus, Loader2, Upload, Plus, X } from "lucide-react";
import { useState, useRef } from "react";
import { toast } from "sonner";
import type { Memory } from "@/lib/api";
import { Vault } from "@/lib/api";
import { formatCountdown, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { CandleButton } from "@/components/nostalgia/candle-button";

export function VaultCard({
  vault,
  onDelete,
  onOpen,
  onShare,
}: {
  vault: Vault;
  onDelete?: () => void;
  onOpen?: () => void;
  onShare?: () => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const isUnlocked = new Date(vault.unlockAt) <= new Date();

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -3 }}
      onClick={onOpen}
      className={cn(
        "group relative rounded-2xl overflow-hidden bg-card border border-border/60 cursor-pointer transition-all hover:border-primary/30 hover:shadow-warm",
        isUnlocked && "ring-1 ring-accent/40"
      )}
    >
      {/* Cover */}
      <div className="relative aspect-[4/3] overflow-hidden">
        {vault.coverImage ? (
          <img src={vault.coverImage} alt={vault.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 via-accent/20 to-primary/10 grid place-items-center">
            <Lock className="size-10 text-accent/60" />
          </div>
        )}

        {/* Status overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/0 to-black/0" />

        <div className="absolute top-3 left-3 flex items-center gap-2">
          <span className={cn(
            "px-2 py-0.5 rounded-full text-[10px] font-medium backdrop-blur-md",
            isUnlocked ? "bg-accent text-accent-foreground" : "bg-black/50 text-white"
          )}>
            {isUnlocked ? (
              <span className="inline-flex items-center gap-1"><Unlock className="size-2.5" /> Unlocked</span>
            ) : (
              <span className="inline-flex items-center gap-1"><Lock className="size-2.5" /> Sealed</span>
            )}
          </span>
          {vault.isPublic && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-black/50 text-white backdrop-blur-md inline-flex items-center gap-1">
              <Globe className="size-2.5" /> Public
            </span>
          )}
          {vault._role === "contributor" && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-accent/90 text-accent-foreground backdrop-blur-md inline-flex items-center gap-1">
              <UserPlus className="size-2.5" /> Contributing
            </span>
          )}
        </div>

        <div className="absolute bottom-3 left-3 right-3 text-white">
          <h3 className="font-display text-lg font-semibold leading-tight drop-shadow-md line-clamp-2">
            {vault.title}
          </h3>
        </div>
      </div>

      {/* Body */}
      <div className="p-4">
        {vault.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 mb-3 leading-relaxed">
            {vault.description}
          </p>
        )}

        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Clock className="size-3" />
              {isUnlocked ? (
                <>Unlocked {formatDate(vault.unlockAt)}</>
              ) : (
                <span className="text-gradient-warm font-medium">
                  {formatCountdown(vault.unlockAt)} left
                </span>
              )}
            </span>
            {vault.memories?.length > 0 && (
              <span className="inline-flex items-center gap-1">
                <ImageIcon className="size-3" />
                {vault.memories.length}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {/* Candle reaction — only shown on public discover/vault pages */}
            {vault.reactionCount !== undefined && (
              <CandleButton
                vaultId={vault.id}
                initialCount={vault.reactionCount}
                size="sm"
              />
            )}
            {vault.user && (
              <span className="text-[10px] text-muted-foreground">
                by {vault.user.name}
              </span>
            )}
          </div>
        </div>

        {!isUnlocked && (
          <div className="mt-3">
            <div className="h-1 rounded-full bg-muted overflow-hidden">
              <CountdownBar unlockAt={vault.unlockAt} createdAt={vault.createdAt} />
            </div>
          </div>
        )}

        {onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (confirmDelete) {
                onDelete();
              } else {
                setConfirmDelete(true);
                setTimeout(() => setConfirmDelete(false), 3000);
              }
            }}
            className={cn(
              "absolute top-3 right-3 size-7 grid place-items-center rounded-full transition-all",
              confirmDelete
                ? "bg-destructive text-white"
                : "bg-black/40 text-white opacity-0 group-hover:opacity-100 hover:bg-destructive"
            )}
            aria-label="Delete vault"
          >
            <Trash2 className="size-3.5" />
          </button>
        )}
        {onShare && !confirmDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onShare();
            }}
            className={cn(
              "absolute top-3 size-7 grid place-items-center rounded-full transition-all",
              onDelete ? "right-12" : "right-3",
              "bg-black/40 text-white opacity-0 group-hover:opacity-100 hover:bg-primary"
            )}
            aria-label="Share vault"
            title="Share with friends"
          >
            <Share2 className="size-3.5" />
          </button>
        )}
      </div>
    </motion.div>
  );
}

function CountdownBar({ unlockAt, createdAt }: { unlockAt: string; createdAt: string }) {
  const start = new Date(createdAt).getTime();
  const end = new Date(unlockAt).getTime();
  const now = Date.now();
  const total = end - start;
  const elapsed = now - start;
  const pct = Math.max(0, Math.min(100, (elapsed / total) * 100));
  return (
    <motion.div
      initial={{ width: 0 }}
      animate={{ width: `${pct}%` }}
      transition={{ duration: 1, ease: "easeOut" }}
      className="h-full bg-gradient-to-r from-primary to-accent"
    />
  );
}

export function VaultDetail({ vault, onClose }: { vault: Vault; onClose: () => void }) {
  const isUnlocked = new Date(vault.unlockAt) <= new Date();
  // Local state for memories so we can update the UI when memories are added
  // without needing to refetch the whole vault from the server.
  const [memories, setMemories] = useState(vault.memories || []);
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[80] grid place-items-center p-4"
    >
      <div className="absolute inset-0 bg-background/70 backdrop-blur-md" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-card border border-border/60 rounded-3xl shadow-warm"
      >
        {vault.coverImage && (
          <div className="relative aspect-[16/9] overflow-hidden rounded-t-3xl">
            <img src={vault.coverImage} alt={vault.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
          </div>
        )}
        <div className="p-6 lg:p-8">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h2 className="font-display text-2xl lg:text-3xl font-semibold">{vault.title}</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {isUnlocked ? (
                  <>Unlocked on {formatDate(vault.unlockAt)}</>
                ) : (
                  <>Unlocks on {formatDate(vault.unlockAt)} · {formatCountdown(vault.unlockAt)} remaining</>
                )}
              </p>
            </div>
          </div>

          {vault.description && (
            <p className="font-serif text-base leading-relaxed mb-6">{vault.description}</p>
          )}

          {/* Public link bar */}
          {vault.isPublic && (
            <div className="mb-3 p-3 rounded-xl bg-muted/40 border border-border/60 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">
                  Public link
                </div>
                <a
                  href={`/v/${vault.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline truncate block"
                  onClick={(e) => e.stopPropagation()}
                >
                  {typeof window !== "undefined" ? `${window.location.origin}/v/${vault.id}` : `/v/${vault.id}`}
                </a>
              </div>
              <CopyLinkButton id={vault.id} kind="v" />
            </div>
          )}

          {/* Collaborative invite link — owner only.
              Use === "owner" (not !== "contributor") so the button doesn't
              appear on vaults fetched via scope=public or scope=shared,
              where _role is undefined (i.e. the viewer isn't the owner). */}
          {!isUnlocked && vault._role === "owner" && (
            <InviteLinkButton vaultId={vault.id} />
          )}

          <div className="vintage-divider mb-6" />

          {isUnlocked ? (
            <div className="grid sm:grid-cols-2 gap-4">
              {memories.map((m) => (
                <div key={m.id} className="rounded-2xl overflow-hidden border border-border/60">
                  {m.type === "VIDEO" ? (
                    <video src={m.url} controls className="w-full aspect-video bg-black" />
                  ) : (
                    <img src={m.url} alt={m.caption || ""} className="w-full aspect-video object-cover" />
                  )}
                  {m.caption && (
                    <div className="p-3 text-xs text-muted-foreground font-serif italic">
                      {m.caption}
                    </div>
                  )}
                </div>
              ))}
              {memories.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  No memories inside this vault.
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 px-6 rounded-2xl bg-muted/40 border border-dashed border-border/60">
              <div className="size-16 mx-auto mb-4 rounded-full bg-card border border-border/60 grid place-items-center">
                <Lock className="size-7 text-accent animate-pulse-warm" />
              </div>
              <h3 className="font-display text-xl font-semibold mb-2">Still sealed</h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-5">
                This vault holds <span className="font-medium text-foreground">{memories.length}</span> memories.
                They will be revealed in <span className="text-gradient-warm font-semibold">{formatCountdown(vault.unlockAt)}</span>.
              </p>
              <div className="max-w-xs mx-auto">
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <CountdownBar unlockAt={vault.unlockAt} createdAt={vault.createdAt} />
                </div>
              </div>
              {/* Add memories — only visible to the owner or contributors.
                  Vaults from scope=public/shared have _role: undefined and
                  must NOT show this button (the viewer can't add memories). */}
              {vault._role === "owner" || vault._role === "contributor" ? (
                <div className="mt-6">
                  <AddMemoriesButton
                    vaultId={vault.id}
                    role={vault._role}
                    currentCount={memories.length}
                    onAdded={(updatedMemories) => setMemories(updatedMemories)}
                  />
                </div>
              ) : null}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

function CopyLinkButton({ id, kind }: { id: string; kind: "v" | "a" }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/${kind}/${id}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };
  return (
    <button
      onClick={handleCopy}
      className={cn(
        "shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all",
        copied
          ? "bg-accent text-accent-foreground"
          : "bg-card border border-border hover:border-primary/40"
      )}
    >
      {copied ? <Check className="size-3" /> : <Link2 className="size-3" />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

function InviteLinkButton({ vaultId }: { vaultId: string }) {
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setLoading(true);
    try {
      const res = await fetch(`/api/vaults/${vaultId}/invite`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setToken(data.inviteToken);
    } catch {
      // ignore — not the owner, probably
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!token) return;
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/join-vault/${token}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  if (!token) {
    return (
      <button
        onClick={handleGenerate}
        disabled={loading}
        className="w-full mb-3 inline-flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed border-border hover:border-primary/40 transition-colors text-xs text-muted-foreground hover:text-foreground disabled:opacity-60"
      >
        {loading ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : (
          <UserPlus className="size-3.5" />
        )}
        Invite friends to add memories
      </button>
    );
  }

  return (
    <div className="mb-3 p-3 rounded-xl bg-muted/40 border border-border/60 flex items-center justify-between gap-3">
      <div className="min-w-0">
        <div className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">
          Invite link · others can add memories
        </div>
        <span className="text-xs text-primary truncate block">
          {typeof window !== "undefined" ? `${window.location.origin}/join-vault/${token}` : `/join-vault/${token}`}
        </span>
      </div>
      <button
        onClick={handleCopy}
        className={cn(
          "shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all",
          copied
            ? "bg-accent text-accent-foreground"
            : "bg-card border border-border hover:border-primary/40"
        )}
      >
        {copied ? <Check className="size-3" /> : <Link2 className="size-3" />}
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}

function AddMemoriesButton({
  vaultId,
  role,
  currentCount,
  onAdded,
}: {
  vaultId: string;
  role?: "owner" | "contributor";
  currentCount: number;
  onAdded: (memories: Memory[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [pending, setPending] = useState<
    { url: string; type: string; caption?: string }[]
  >([]);
  const [saving, setSaving] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleFiles = async (files: File[]) => {
    if (!files.length) return;
    setUploading(true);
    try {
      const formData = new FormData();
      files.forEach((f) => formData.append("files", f));
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      setPending((p) => [
        ...p,
        ...data.files.map(
          (f: { url: string; type: string }) =>
            ({ url: f.url, type: f.type }) as {
              url: string;
              type: string;
              caption?: string;
            }
        ),
      ]);
      toast.success(`${files.length} file${files.length > 1 ? "s" : ""} added`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (pending.length === 0) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/vaults/${vaultId}/memories`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memories: pending }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not add memories");
      onAdded(data.vault.memories as Memory[]);
      toast.success(`Added ${data.added} ${data.added === 1 ? "memory" : "memories"} to the vault`);
      setPending([]);
      setOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not add memories");
    } finally {
      setSaving(false);
    }
  };

  if (!open) {
    const cta =
      role === "contributor"
        ? "Add your memories"
        : currentCount === 0
        ? "Add memories to this vault"
        : "Add more memories";
    return (
      <button
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
        }}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-medium shadow-warm hover:shadow-glow transition-all hover:-translate-y-0.5"
      >
        <Plus className="size-4" />
        {cta}
      </button>
    );
  }

  return (
    <div
      className="rounded-2xl border border-border/60 bg-card p-4 text-left"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm font-medium">Add memories</div>
        <button
          onClick={() => {
            setOpen(false);
            setPending([]);
          }}
          className="size-7 grid place-items-center rounded-full hover:bg-muted"
          aria-label="Close"
        >
          <X className="size-3.5" />
        </button>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFiles(Array.from(e.dataTransfer.files));
        }}
        className={cn(
          "rounded-xl border-2 border-dashed p-4 text-center transition-all",
          dragOver
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/40 bg-muted/30"
        )}
      >
        <input
          type="file"
          multiple
          accept="image/*,video/*"
          className="hidden"
          onChange={(e) => {
            if (e.target.files) handleFiles(Array.from(e.target.files));
            e.target.value = "";
          }}
          ref={inputRef}
        />
        <Upload className="size-5 text-accent mx-auto mb-1" />
        <p className="text-xs font-medium">
          {uploading ? "Uploading..." : "Drag & drop or click to upload"}
        </p>
        <button
          onClick={() => inputRef.current?.click()}
          className="mt-2 text-[10px] text-primary hover:underline"
        >
          Browse files
        </button>
      </div>

      {/* Pending previews */}
      {pending.length > 0 && (
        <div className="mt-3 grid grid-cols-4 gap-2">
          {pending.map((m, i) => (
            <div
              key={i}
              className="relative aspect-square rounded-md overflow-hidden bg-muted group"
            >
              {m.type === "VIDEO" ? (
                <video src={m.url} className="w-full h-full object-cover" muted />
              ) : (
                <img src={m.url} alt="" className="w-full h-full object-cover" />
              )}
              <button
                onClick={() => setPending((p) => p.filter((_, j) => j !== i))}
                className="absolute top-0.5 right-0.5 size-4 grid place-items-center rounded-full bg-destructive text-white opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="size-2" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="mt-3 flex items-center justify-between gap-2">
        <div className="text-[10px] text-muted-foreground">
          {pending.length > 0
            ? `${pending.length} ready to add`
            : "JPG, PNG, WebP, MP4 · max 8 MB each"}
        </div>
        <button
          onClick={handleSave}
          disabled={saving || uploading || pending.length === 0}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-medium shadow-warm hover:shadow-glow transition-all disabled:opacity-60"
        >
          {saving ? (
            <><Loader2 className="size-3 animate-spin" /> Adding...</>
          ) : (
            <><Plus className="size-3" /> Add {pending.length > 0 ? pending.length : ""}</>
          )}
        </button>
      </div>
    </div>
  );
}
