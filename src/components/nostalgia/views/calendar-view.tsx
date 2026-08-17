"use client";

import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  CalendarHeart,
  ChevronLeft,
  ChevronRight,
  Lock,
  Unlock,
  Sparkles,
  Clock,
} from "lucide-react";
import { api, Vault } from "@/lib/api";
import { useSession } from "next-auth/react";
import { formatCountdown, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

export function CalendarView() {
  const { data: session } = useSession();
  const user = session?.user;
  const [vaults, setVaults] = useState<Vault[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(() => new Date());

  useEffect(() => {
    let active = true;
    if (!user) return;
    const run = async () => {
      try {
        const r = await api.vaults.list("mine");
        if (active) {
          setVaults(r.vaults || []);
          setLoading(false);
        }
      } catch {
        if (active) setLoading(false);
      }
    };
    run();
    return () => { active = false; };
  }, [user]);

  // Build month grid
  const { weeks, monthLabel } = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startPad = firstDay.getDay();
    const totalDays = lastDay.getDate();

    const cells: { date: Date | null; vaults: Vault[] }[] = [];
    for (let i = 0; i < startPad; i++) cells.push({ date: null, vaults: [] });
    for (let d = 1; d <= totalDays; d++) {
      const date = new Date(year, month, d);
      const dayVaults = vaults.filter((v) => {
        const vd = new Date(v.unlockAt);
        return vd.getDate() === d && vd.getMonth() === month && vd.getFullYear() === year;
      });
      cells.push({ date, vaults: dayVaults });
    }
    while (cells.length % 7 !== 0) cells.push({ date: null, vaults: [] });
    const weeks: { date: Date | null; vaults: Vault[] }[][] = [];
    for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

    const monthLabel = new Date(year, month, 1).toLocaleDateString(undefined, {
      month: "long",
      year: "numeric",
    });
    return { weeks, monthLabel };
  }, [currentMonth, vaults]);

  const upcoming = vaults
    .filter((v) => new Date(v.unlockAt) > new Date())
    .sort((a, b) => new Date(a.unlockAt).getTime() - new Date(b.unlockAt).getTime())
    .slice(0, 6);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <div className="text-sm text-muted-foreground mb-1 flex items-center gap-2">
          <CalendarHeart className="size-3.5 text-accent" />
          <span>Memory Calendar</span>
        </div>
        <h1 className="font-display text-3xl lg:text-4xl font-semibold tracking-tight">
          The <span className="text-gradient-warm italic">calendar of moments</span>
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Every dot marks a day a sealed capsule will unlock. Time, made visible.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2 bg-card border border-border/60 rounded-3xl p-5">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display text-xl font-semibold">{monthLabel}</h2>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
                className="size-9 grid place-items-center rounded-full hover:bg-muted transition-colors"
                aria-label="Previous month"
              >
                <ChevronLeft className="size-4" />
              </button>
              <button
                onClick={() => setCurrentMonth(new Date())}
                className="px-3 py-1.5 rounded-full text-xs hover:bg-muted transition-colors"
              >
                Today
              </button>
              <button
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
                className="size-9 grid place-items-center rounded-full hover:bg-muted transition-colors"
                aria-label="Next month"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div key={d} className="text-[10px] font-medium text-muted-foreground text-center py-1">
                {d}
              </div>
            ))}
          </div>

          {/* Cells */}
          <div className="space-y-1">
            {weeks.map((week, wi) => (
              <div key={wi} className="grid grid-cols-7 gap-1">
                {week.map((cell, ci) => {
                  if (!cell.date) {
                    return <div key={ci} className="aspect-square min-h-[60px]" />;
                  }
                  const today = new Date();
                  const isToday =
                    cell.date.getDate() === today.getDate() &&
                    cell.date.getMonth() === today.getMonth() &&
                    cell.date.getFullYear() === today.getFullYear();
                  const isPast = cell.date < today && !isToday;
                  const hasVaults = cell.vaults.length > 0;

                  return (
                    <motion.div
                      key={ci}
                      whileHover={hasVaults ? { scale: 1.05 } : undefined}
                      className={cn(
                        "aspect-square min-h-[60px] rounded-xl p-1.5 relative border transition-all",
                        isToday
                          ? "border-primary bg-primary/5"
                          : hasVaults
                          ? "border-accent/40 bg-accent/5 cursor-pointer hover:border-accent"
                          : "border-border/40 hover:border-border",
                        isPast && !hasVaults && "opacity-40"
                      )}
                    >
                      <div className={cn(
                        "text-xs font-medium",
                        isToday ? "text-primary" : "text-muted-foreground"
                      )}>
                        {cell.date.getDate()}
                      </div>
                      {hasVaults && (
                        <div className="mt-1 space-y-0.5">
                          {cell.vaults.slice(0, 2).map((v) => {
                            const isUnlocked = new Date(v.unlockAt) <= new Date();
                            return (
                              <div
                                key={v.id}
                                className={cn(
                                  "text-[9px] px-1 py-0.5 rounded truncate inline-flex items-center gap-0.5 w-full",
                                  isUnlocked
                                    ? "bg-accent/20 text-accent"
                                    : "bg-primary/15 text-primary"
                                )}
                              >
                                {isUnlocked ? <Unlock className="size-2" /> : <Lock className="size-2" />}
                                <span className="truncate">{v.title}</span>
                              </div>
                            );
                          })}
                          {cell.vaults.length > 2 && (
                            <div className="text-[9px] text-muted-foreground px-1">
                              +{cell.vaults.length - 2} more
                            </div>
                          )}
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="mt-5 pt-4 border-t border-border/60 flex items-center gap-4 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <Lock className="size-3 text-primary" /> Sealed
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Unlock className="size-3 text-accent" /> Unlocked
            </span>
          </div>
        </div>

        {/* Upcoming list */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Clock className="size-4 text-accent" />
            <h3 className="font-display text-lg font-semibold">Next unlocks</h3>
          </div>
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 rounded-2xl bg-muted/40 animate-pulse" />
              ))}
            </div>
          ) : upcoming.length === 0 ? (
            <div className="text-center py-12 px-4 rounded-2xl border border-dashed border-border/60 bg-muted/30">
              <Sparkles className="size-6 text-accent mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">
                No upcoming unlocks. Create a vault to begin the countdown.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {upcoming.map((v) => (
                <motion.div
                  key={v.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 rounded-2xl bg-card border border-border/60 hover:border-primary/30 transition-colors"
                >
                  <div className="flex items-start gap-2 mb-2">
                    <div className="size-9 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 grid place-items-center shrink-0 overflow-hidden">
                      {v.coverImage ? (
                        <img src={v.coverImage} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <Lock className="size-4 text-accent" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{v.title}</div>
                      <div className="text-[10px] text-muted-foreground">
                        {formatDate(v.unlockAt)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-[10px] text-muted-foreground">Unlocks in</div>
                    <div className="text-xs font-semibold text-gradient-warm">
                      {formatCountdown(v.unlockAt)}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
