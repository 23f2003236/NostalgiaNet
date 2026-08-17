"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Check, Clock, Users, Sparkles, X } from "lucide-react";
import { api, NotificationItem } from "@/lib/api";
import { cn } from "@/lib/utils";

export function NotificationsBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    const run = async () => {
      try {
        const r = await api.notifications.list();
        if (!active) return;
        setItems(r.notifications);
        setUnread(r.unread);
      } catch {
        // ignore
      } finally {
        if (active) setLoading(false);
      }
    };
    run();
    // poll every 60s
    const t = setInterval(run, 60000);
    return () => {
      active = false;
      clearInterval(t);
    };
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await api.notifications.markAllRead();
      setItems((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnread(0);
    } catch {
      // ignore
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => {
          setOpen((v) => !v);
          // Re-fetch notifications when opening the dropdown
          if (!open) {
            setLoading(true);
            api.notifications.list().then((r) => {
              setItems(r.notifications);
              setUnread(r.unread);
              setLoading(false);
            }).catch(() => setLoading(false));
          }
        }}
        className="relative size-9 grid place-items-center rounded-full hover:bg-muted text-foreground"
        aria-label="Notifications"
      >
        <Bell className="size-4" />
        {unread > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute top-1 right-1 size-4 rounded-full bg-accent text-accent-foreground text-[9px] font-bold grid place-items-center"
          >
            {unread > 9 ? "9+" : unread}
          </motion.span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.96 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-full mt-2 w-80 max-h-[420px] overflow-y-auto bg-card border border-border/60 rounded-2xl shadow-warm z-50"
            >
              <div className="sticky top-0 bg-card/90 backdrop-blur-md px-4 py-3 flex items-center justify-between border-b border-border/60 z-10">
                <div className="flex items-center gap-2">
                  <Bell className="size-4 text-accent" />
                  <span className="font-display text-sm font-semibold">Notifications</span>
                </div>
                <div className="flex items-center gap-1">
                  {unread > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-[10px] text-primary hover:underline px-2 py-0.5"
                    >
                      Mark all read
                    </button>
                  )}
                  <button
                    onClick={() => setOpen(false)}
                    className="size-6 grid place-items-center rounded-full hover:bg-muted"
                  >
                    <X className="size-3" />
                  </button>
                </div>
              </div>

              {loading ? (
                <div className="p-4 space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-12 bg-muted/40 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : items.length === 0 ? (
                <div className="p-8 text-center">
                  <Bell className="size-6 text-muted-foreground mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">No notifications yet.</p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Unlock reminders and friend requests will appear here.
                  </p>
                </div>
              ) : (
                <div className="p-2">
                  {items.map((n) => {
                    const Icon =
                      n.type === "UNLOCK_REMINDER" ? Clock :
                      n.type === "FRIEND_REQUEST" ? Users :
                      n.type === "SHARED_VAULT" ? Sparkles : Bell;
                    return (
                      <a
                        key={n.id}
                        href={n.link || "#"}
                        onClick={() => setOpen(false)}
                        className={cn(
                          "block p-3 rounded-xl hover:bg-muted/60 transition-colors",
                          !n.read && "bg-primary/5"
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <div className={cn(
                            "size-8 rounded-full grid place-items-center shrink-0",
                            !n.read ? "bg-accent/15 text-accent" : "bg-muted text-muted-foreground"
                          )}>
                            <Icon className="size-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-medium leading-snug">{n.title}</div>
                            <div className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">
                              {n.body}
                            </div>
                            <div className="text-[10px] text-muted-foreground mt-1">
                              {formatRelative(n.createdAt)}
                            </div>
                          </div>
                          {!n.read && (
                            <div className="size-2 rounded-full bg-accent shrink-0 mt-1" />
                          )}
                        </div>
                      </a>
                    );
                  })}
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function formatRelative(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return "just now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d ago`;
  return new Date(dateStr).toLocaleDateString();
}
