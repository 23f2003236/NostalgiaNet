"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { X, Share2, Loader2, Check, UserCheck, Mail, Send } from "lucide-react";
import { toast } from "sonner";
import { api, Vault } from "@/lib/api";
import { cn } from "@/lib/utils";

export function ShareVaultModal({
  vault,
  onClose,
}: {
  vault: Vault;
  onClose: () => void;
}) {
  const [friends, setFriends] = useState<{ id: string; name: string; email: string; avatar?: string | null }[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [existingShares, setExistingShares] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    let active = true;
    const run = async () => {
      try {
        const [friendsRes, sharesRes] = await Promise.all([
          api.friends.list(),
          api.share.list(vault.id),
        ]);
        if (!active) return;
        setFriends(friendsRes.friends || []);
        const existing = new Set<string>();
        (sharesRes.shares || []).forEach((s) => existing.add(s.recipient.id));
        setExistingShares(existing);
      } catch {
        toast.error("Could not load your friends");
      } finally {
        if (active) setLoading(false);
      }
    };
    run();
    return () => { active = false; };
  }, [vault.id]);

  const toggle = (id: string) => {
    if (existingShares.has(id)) return;
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleShare = async () => {
    if (selectedIds.size === 0) {
      toast.error("Pick at least one friend");
      return;
    }
    setSharing(true);
    try {
      const result = await api.share.create(vault.id, Array.from(selectedIds));
      toast.success(
        result.skipped > 0
          ? `Shared with ${result.shared} friend${result.shared === 1 ? "" : "s"}. ${result.skipped} already had access.`
          : `Shared with ${result.shared} friend${result.shared === 1 ? "" : "s"}.`
      );
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not share");
    } finally {
      setSharing(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[95] grid place-items-center p-4"
    >
      <div className="absolute inset-0 bg-background/70 backdrop-blur-md" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        className="relative w-full max-w-md bg-card border border-border/60 rounded-3xl shadow-warm overflow-hidden"
      >
        <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-primary via-accent to-primary opacity-70" />
        <button onClick={onClose} className="absolute top-4 right-4 size-8 grid place-items-center rounded-full hover:bg-muted z-10" aria-label="Close">
          <X className="size-4" />
        </button>

        <div className="p-6 lg:p-7">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Share2 className="size-3.5 text-accent" />
            <span>Share capsule</span>
          </div>
          <h2 className="font-display text-2xl font-semibold mb-1">
            Share with friends
          </h2>
          <p className="text-sm text-muted-foreground mb-5">
            &ldquo;{vault.title}&rdquo; will appear in your friends&apos; &ldquo;Shared with me&rdquo; tab.
            They&apos;ll see a notification right away.
          </p>

          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-14 bg-muted/40 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : friends.length === 0 ? (
            <div className="text-center py-8 px-4 rounded-2xl bg-muted/40 border border-dashed border-border/60">
              <Mail className="size-6 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm font-medium">No friends yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Visit the Friends page to invite someone first.
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {friends.map((f) => {
                const isSelected = selectedIds.has(f.id);
                const isExisting = existingShares.has(f.id);
                return (
                  <button
                    key={f.id}
                    onClick={() => toggle(f.id)}
                    disabled={isExisting}
                    className={cn(
                      "w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left",
                      isExisting
                        ? "border-border/60 bg-muted/30 opacity-70 cursor-not-allowed"
                        : isSelected
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/40"
                    )}
                  >
                    <div className="size-9 rounded-full bg-gradient-to-br from-primary to-accent grid place-items-center text-primary-foreground font-semibold text-sm shrink-0">
                      {f.name?.[0]?.toUpperCase() || "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{f.name}</div>
                      <div className="text-[10px] text-muted-foreground truncate">{f.email}</div>
                    </div>
                    {isExisting ? (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground inline-flex items-center gap-1">
                        <Check className="size-2.5" /> Shared
                      </span>
                    ) : (
                      <div className={cn(
                        "size-5 rounded-md border-2 grid place-items-center transition-colors",
                        isSelected ? "bg-primary border-primary" : "border-border"
                      )}>
                        {isSelected && <Check className="size-3 text-primary-foreground" />}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {friends.length > 0 && (
            <div className="flex items-center justify-between gap-2 mt-5 pt-5 border-t border-border/60">
              <div className="text-xs text-muted-foreground">
                {selectedIds.size > 0 ? (
                  <span className="inline-flex items-center gap-1">
                    <UserCheck className="size-3 text-accent" />
                    {selectedIds.size} selected
                  </span>
                ) : (
                  "Select friends to share with"
                )}
              </div>
              <button
                onClick={handleShare}
                disabled={sharing || selectedIds.size === 0}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-primary text-primary-foreground text-sm font-medium shadow-warm hover:shadow-glow transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {sharing ? (
                  <><Loader2 className="size-4 animate-spin" /> Sharing...</>
                ) : (
                  <><Send className="size-4" /> Share</>
                )}
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
