"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

// ── LocalStorage helpers (SSR-safe) ──────────────────────────────────────────

function getVisitorId(): string {
  try {
    const KEY = "nostalgia-visitor-id";
    const existing = localStorage.getItem(KEY);
    if (existing) return existing;
    const id = crypto.randomUUID();
    localStorage.setItem(KEY, id);
    return id;
  } catch {
    return "anon";
  }
}

function hasLit(vaultId: string): boolean {
  try {
    const raw = localStorage.getItem("nostalgia-lit-vaults");
    if (!raw) return false;
    return (JSON.parse(raw) as string[]).includes(vaultId);
  } catch {
    return false;
  }
}

function markLit(vaultId: string) {
  try {
    const raw = localStorage.getItem("nostalgia-lit-vaults");
    const set: string[] = raw ? (JSON.parse(raw) as string[]) : [];
    if (!set.includes(vaultId)) {
      set.push(vaultId);
      localStorage.setItem("nostalgia-lit-vaults", JSON.stringify(set));
    }
  } catch {}
}

// ── Component ─────────────────────────────────────────────────────────────────

export function CandleButton({
  vaultId,
  initialCount = 0,
  size = "md",
}: {
  vaultId: string;
  initialCount?: number;
  size?: "sm" | "md";
}) {
  const [count, setCount] = useState(initialCount);
  const [lit, setLit] = useState(false);
  const [glow, setGlow] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Hydrate localStorage state only after mount (avoids SSR mismatch)
  useEffect(() => {
    setMounted(true);
    setLit(hasLit(vaultId));
  }, [vaultId]);

  const handleClick = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!mounted || lit) return;

      // Optimistic update — feels instant
      setLit(true);
      setCount((c) => c + 1);
      setGlow(true);
      setTimeout(() => setGlow(false), 700);
      markLit(vaultId);

      // Persist to server (deduped by @@unique[vaultId, visitorId])
      try {
        await fetch("/api/reactions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ vaultId, visitorId: getVisitorId() }),
        });
      } catch {
        // Optimistic update stands — UX is preserved even if server is unreachable
      }
    },
    [mounted, lit, vaultId]
  );

  const sm = size === "sm";

  return (
    <button
      onClick={handleClick}
      disabled={!mounted}
      title={lit ? "You lit a candle for this capsule" : "Light a candle for this capsule"}
      aria-label={lit ? "Candle lit" : "Light a candle"}
      className={cn(
        "relative inline-flex items-center gap-1 rounded-full font-medium select-none transition-all",
        sm ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs",
        lit
          ? "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 cursor-default"
          : "text-muted-foreground hover:text-amber-500 hover:bg-amber-50/60 dark:hover:bg-amber-950/20 cursor-pointer",
        !mounted && "opacity-60"
      )}
    >
      {/* Glow burst on click */}
      <AnimatePresence>
        {glow && (
          <motion.span
            key="glow"
            initial={{ scale: 0.8, opacity: 0.6 }}
            animate={{ scale: 2.8, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="absolute inset-0 rounded-full bg-amber-300/40 pointer-events-none"
          />
        )}
      </AnimatePresence>

      {/* Candle flicker on click */}
      <motion.span
        animate={glow ? { scale: [1, 1.5, 0.9, 1.1, 1], rotate: [0, -8, 8, -4, 0] } : {}}
        transition={{ duration: 0.5 }}
        style={{ fontSize: sm ? "0.65rem" : "0.75rem", lineHeight: 1 }}
      >
        {lit ? "\uD83D\uDD6F\uFE0F" : "\uD83D\uDD6F\uFE0F"}
      </motion.span>

      {/* Count — only show if > 0 */}
      {(count > 0) && (
        <span className="tabular-nums leading-none">{count}</span>
      )}
    </button>
  );
}