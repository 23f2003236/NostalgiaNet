"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookHeart,
  Plus,
  X,
  Loader2,
  CloudSun,
  MapPin,
  Tag,
  Sparkles,
  Trash2,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";
import { api, Journal } from "@/lib/api";
import { useSession } from "next-auth/react";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

const MOODS = [
  { key: "HAPPY", label: "Happy", emoji: "😊", color: "bg-amber-500/15 text-amber-700 dark:text-amber-300" },
  { key: "CALM", label: "Calm", emoji: "🌙", color: "bg-blue-500/15 text-blue-700 dark:text-blue-300" },
  { key: "GRATEFUL", label: "Grateful", emoji: "🙏", color: "bg-rose-500/15 text-rose-700 dark:text-rose-300" },
  { key: "EXCITED", label: "Excited", emoji: "✨", color: "bg-orange-500/15 text-orange-700 dark:text-orange-300" },
  { key: "NOSTALGIC", label: "Nostalgic", emoji: "📻", color: "bg-purple-500/15 text-purple-700 dark:text-purple-300" },
  { key: "SAD", label: "Sad", emoji: "🌧", color: "bg-slate-500/15 text-slate-700 dark:text-slate-300" },
  { key: "THOUGHTFUL", label: "Thoughtful", emoji: "🤔", color: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300" },
];

const WEATHERS = ["Sunny", "Cloudy", "Rainy", "Snowy", "Stormy", "Foggy", "Windy", "Clear night"];

export function JournalView() {
  const { data: session } = useSession();
  const user = session?.user;
  const [journals, setJournals] = useState<Journal[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [selected, setSelected] = useState<Journal | null>(null);

  useEffect(() => {
    let active = true;
    if (!user) return;
    const run = async () => {
      try {
        const r = await api.journals.list();
        if (active) {
          setJournals(r.journals || []);
          setLoading(false);
        }
      } catch {
        if (active) {
          toast.error("Could not load journal");
          setLoading(false);
        }
      }
    };
    run();
    return () => { active = false; };
  }, [user]);

  const handleDelete = async (id: string) => {
    if (!user) return;
    try {
      await api.journals.delete(id);
      setJournals((prev) => prev.filter((j) => j.id !== id));
      toast.success("Entry removed");
    } catch {
      toast.error("Could not remove entry");
    }
  };

  // Group by month
  const grouped: { month: string; entries: Journal[] }[] = [];
  journals.forEach((j) => {
    const d = new Date(j.createdAt);
    const monthKey = d.toLocaleDateString(undefined, { month: "long", year: "numeric" });
    let g = grouped.find((g) => g.month === monthKey);
    if (!g) {
      g = { month: monthKey, entries: [] };
      grouped.push(g);
    }
    g.entries.push(j);
  });

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <div className="text-sm text-muted-foreground mb-1 flex items-center gap-2">
            <BookHeart className="size-3.5 text-accent" />
            <span>Journal</span>
          </div>
          <h1 className="font-display text-3xl lg:text-4xl font-semibold tracking-tight">
            Your living <span className="text-gradient-warm italic">diary</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Capture today's weather, mood, and thoughts. Read them years from now.
          </p>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-primary-foreground font-medium text-sm shadow-warm hover:shadow-glow transition-all hover:-translate-y-0.5"
        >
          <Plus className="size-4" />
          New entry
        </button>
      </div>

      {/* Mood filter chips */}
      {journals.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {MOODS.map((m) => {
            const count = journals.filter((j) => j.mood === m.key).length;
            if (count === 0) return null;
            return (
              <div key={m.key} className={cn("inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs", m.color)}>
                <span>{m.emoji}</span>
                <span>{m.label}</span>
                <span className="opacity-60">· {count}</span>
              </div>
            );
          })}
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-2xl bg-card border border-border/60 p-6">
              <div className="h-4 bg-muted rounded animate-pulse w-1/3 mb-3" />
              <div className="h-3 bg-muted rounded animate-pulse w-full mb-2" />
              <div className="h-3 bg-muted rounded animate-pulse w-2/3" />
            </div>
          ))}
        </div>
      ) : journals.length === 0 ? (
        <EmptyJournal onCreate={() => setCreating(true)} />
      ) : (
        <div className="relative space-y-8">
          {/* Timeline line */}
          <div className="absolute left-3 top-2 bottom-2 w-px bg-gradient-to-b from-primary/30 via-accent/30 to-transparent" />

          {grouped.map((group) => (
            <div key={group.month}>
              <div className="relative pl-10 mb-3">
                <div className="absolute -left-[1.65rem] top-1 size-3 rounded-full bg-accent ring-4 ring-background" />
                <h3 className="font-display text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  {group.month}
                </h3>
              </div>
              <div className="space-y-3 pl-10">
                {group.entries.map((j) => (
                  <JournalCard
                    key={j.id}
                    journal={j}
                    onClick={() => setSelected(j)}
                    onDelete={() => handleDelete(j.id)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {creating && (
          <CreateJournalModal
            onClose={() => setCreating(false)}
            onCreated={(j) => {
              setJournals((prev) => [j, ...prev]);
              setCreating(false);
              toast.success("Entry saved. Future-you will thank you.");
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selected && (
          <JournalDetail journal={selected} onClose={() => setSelected(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}

function JournalCard({
  journal,
  onClick,
  onDelete,
}: {
  journal: Journal;
  onClick: () => void;
  onDelete: () => void;
}) {
  const mood = MOODS.find((m) => m.key === journal.mood);
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      whileHover={{ y: -2 }}
      onClick={onClick}
      className="group relative bg-card border border-border/60 rounded-2xl p-5 cursor-pointer hover:border-primary/30 hover:shadow-warm transition-all"
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-display text-lg font-semibold leading-tight">{journal.title}</h3>
          <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2 flex-wrap">
            <Calendar className="size-3" />
            {formatDate(journal.createdAt)}
            {journal.location && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="size-3" />
                {journal.location}
              </span>
            )}
            {journal.weather && (
              <span className="inline-flex items-center gap-1">
                <CloudSun className="size-3" />
                {journal.weather}
              </span>
            )}
          </div>
        </div>
        {mood && (
          <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium", mood.color)}>
            <span>{mood.emoji}</span>
            {mood.label}
          </span>
        )}
      </div>
      <p className="text-sm text-muted-foreground font-serif line-clamp-2 leading-relaxed">
        {journal.content}
      </p>
      {journal.tags && (
        <div className="mt-3 flex flex-wrap gap-1">
          {journal.tags.split(",").map((t) => t.trim()).filter(Boolean).map((t, i) => (
            <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground inline-flex items-center gap-1">
              <Tag className="size-2" />
              {t}
            </span>
          ))}
        </div>
      )}
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(); }}
        className="absolute top-3 right-3 size-7 grid place-items-center rounded-full bg-background/80 backdrop-blur opacity-0 group-hover:opacity-100 hover:bg-destructive hover:text-white transition-all"
        aria-label="Delete entry"
      >
        <Trash2 className="size-3.5" />
      </button>
    </motion.div>
  );
}

function JournalDetail({ journal, onClose }: { journal: Journal; onClose: () => void }) {
  const mood = MOODS.find((m) => m.key === journal.mood);
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
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-card border border-border/60 rounded-3xl shadow-warm"
      >
        <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-primary via-accent to-primary opacity-70" />
        <button onClick={onClose} className="absolute top-4 right-4 size-8 grid place-items-center rounded-full hover:bg-muted z-10" aria-label="Close">
          <X className="size-4" />
        </button>
        <div className="p-6 lg:p-8">
          <div className="text-xs text-muted-foreground mb-2 flex items-center gap-2 flex-wrap">
            <Calendar className="size-3" />
            {formatDate(journal.createdAt)}
            {mood && (
              <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium", mood.color)}>
                <span>{mood.emoji}</span>
                {mood.label}
              </span>
            )}
          </div>
          <h2 className="font-display text-2xl lg:text-3xl font-semibold mb-4">{journal.title}</h2>

          {(journal.location || journal.weather) && (
            <div className="flex flex-wrap gap-3 mb-5 text-xs text-muted-foreground">
              {journal.location && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-muted/60">
                  <MapPin className="size-3" />
                  {journal.location}
                </span>
              )}
              {journal.weather && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-muted/60">
                  <CloudSun className="size-3" />
                  {journal.weather}
                </span>
              )}
            </div>
          )}

          <div className="font-serif text-base leading-relaxed whitespace-pre-wrap">
            {journal.content}
          </div>

          {journal.tags && (
            <div className="mt-6 pt-6 border-t border-border/60">
              <div className="text-xs font-medium text-muted-foreground mb-2">Tags</div>
              <div className="flex flex-wrap gap-1">
                {journal.tags.split(",").map((t) => t.trim()).filter(Boolean).map((t, i) => (
                  <span key={i} className="text-xs px-2 py-1 rounded-full bg-muted text-foreground inline-flex items-center gap-1">
                    <Tag className="size-2.5" />
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

function EmptyJournal({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="text-center py-20 px-6 rounded-3xl border border-dashed border-border/60 bg-muted/30">
      <div className="size-16 mx-auto mb-4 rounded-2xl bg-card border border-border/60 grid place-items-center">
        <BookHeart className="size-7 text-accent" />
      </div>
      <h3 className="font-display text-xl font-semibold mb-1">Your diary is empty</h3>
      <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
        Write your first reflection — capture today's mood, weather, and a thought or two.
        It will be waiting for the future-you.
      </p>
      <button
        onClick={onCreate}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-primary-foreground font-medium text-sm shadow-warm hover:shadow-glow transition-all"
      >
        <Plus className="size-4" />
        Write your first entry
      </button>
    </div>
  );
}

function CreateJournalModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (j: Journal) => void;
}) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [mood, setMood] = useState<string>("");
  const [weather, setWeather] = useState("");
  const [location, setLocation] = useState("");
  const [tags, setTags] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) {
      toast.error("Give your entry a title and some thoughts");
      return;
    }
    setSaving(true);
    try {
      const result = await api.journals.create({
        title,
        content,
        mood: mood || undefined,
        weather: weather || undefined,
        location: location || undefined,
        tags: tags || undefined,
      });
      onCreated(result.journal);
    } catch (e) {
      toast.error("Could not save entry");
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
            <span>New journal entry</span>
          </div>
          <h2 className="font-display text-2xl font-semibold mb-6">
            What's on your mind today?
          </h2>

          <div className="space-y-4">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Entry title"
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/15 text-sm transition-all font-display text-lg"
            />

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-2">
                How are you feeling?
              </label>
              <div className="flex flex-wrap gap-2">
                {MOODS.map((m) => (
                  <button
                    key={m.key}
                    onClick={() => setMood(mood === m.key ? "" : m.key)}
                    className={cn(
                      "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
                      mood === m.key
                        ? m.color + " border-transparent ring-2 ring-primary/20"
                        : "border-border hover:border-primary/30 text-muted-foreground"
                    )}
                  >
                    <span>{m.emoji}</span>
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write freely. Future-you is listening..."
              rows={8}
              className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/15 text-sm transition-all resize-none font-serif leading-relaxed"
            />

            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                  <CloudSun className="inline size-3.5 mr-1" />
                  Weather
                </label>
                <select
                  value={weather}
                  onChange={(e) => setWeather(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background focus:border-primary/50 focus:outline-none text-sm"
                >
                  <option value="">Select weather</option>
                  {WEATHERS.map((w) => (
                    <option key={w} value={w}>{w}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                  <MapPin className="inline size-3.5 mr-1" />
                  Location
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Home, Paris, the train"
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/15 text-sm transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                <Tag className="inline size-3.5 mr-1" />
                Tags (comma-separated)
              </label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="e.g. family, gratitude, summer"
                className="w-full px-3 py-2 rounded-xl border border-border bg-background focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/15 text-sm transition-all"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 mt-6 pt-6 border-t border-border/60">
            <button onClick={onClose} className="px-4 py-2 rounded-full text-sm hover:bg-muted">
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-primary text-primary-foreground text-sm font-medium shadow-warm hover:shadow-glow transition-all disabled:opacity-60"
            >
              {saving ? (
                <><Loader2 className="size-4 animate-spin" /> Saving...</>
              ) : (
                <><BookHeart className="size-4" /> Save entry</>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
