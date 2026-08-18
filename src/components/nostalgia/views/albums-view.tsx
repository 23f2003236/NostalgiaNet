"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Images,
  Plus,
  Loader2,
  Upload,
  X,
  Globe,
  Lock,
  Trash2,
  Image as ImageIcon,
  Video,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { api, Album } from "@/lib/api";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";

type Tab = "mine" | "public";

export function AlbumsView() {
  const { data: session } = useSession();
  const user = session?.user;
  const [tab, setTab] = useState<Tab>("mine");
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [selected, setSelected] = useState<Album | null>(null);

  useEffect(() => {
    let active = true;
    if (!user) return;
    const run = async () => {
      try {
        const r = await api.albums.list(tab);
        if (active) {
          setAlbums(r.albums || []);
          setLoading(false);
        }
      } catch {
        if (active) {
          toast.error("Could not load albums");
          setLoading(false);
        }
      }
    };
    run();
    return () => { active = false; };
  }, [tab, user]);

  const handleDelete = async (id: string) => {
    try {
      await api.albums.delete(id);
      setAlbums((prev) => prev.filter((a) => a.id !== id));
      toast.success("Album deleted");
    } catch {
      toast.error("Could not delete album");
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <div className="text-sm text-muted-foreground mb-1 flex items-center gap-2">
            <Images className="size-3.5 text-accent" />
            <span>Albums</span>
          </div>
          <h1 className="font-display text-3xl lg:text-4xl font-semibold tracking-tight">
            Open <span className="text-gradient-warm italic">photo albums</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Curated collections of photos — no sealed date, no countdown. Just memories.
          </p>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-primary-foreground font-medium text-sm shadow-warm hover:shadow-glow transition-all hover:-translate-y-0.5"
        >
          <Plus className="size-4" />
          New album
        </button>
      </div>

      {/* Tabs */}
      <div className="inline-flex p-1 rounded-full bg-muted/60 border border-border/60 mb-6">
        {([
          { key: "mine", label: "My albums" },
          { key: "public", label: "Community" },
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
      ) : albums.length === 0 ? (
        <div className="text-center py-20 px-6 rounded-3xl border border-dashed border-border/60 bg-muted/30">
          <div className="size-16 mx-auto mb-4 rounded-2xl bg-card border border-border/60 grid place-items-center">
            <Images className="size-7 text-accent" />
          </div>
          <h3 className="font-display text-xl font-semibold mb-1">
            {tab === "mine" ? "No albums yet" : "No public albums yet"}
          </h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
            {tab === "mine" && "Group your favorite photos into themed albums. Trips, people, seasons, milestones."}
            {tab === "public" && "Public albums from the community will appear here."}
          </p>
          {tab === "mine" && (
            <button
              onClick={() => setCreating(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-primary-foreground font-medium text-sm shadow-warm hover:shadow-glow transition-all"
            >
              <Plus className="size-4" />
              Create your first album
            </button>
          )}
        </div>
      ) : (
        <motion.div layout className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <AnimatePresence>
            {albums.map((a) => (
              <AlbumCard
                key={a.id}
                album={a}
                onDelete={tab === "mine" ? () => handleDelete(a.id) : undefined}
                onOpen={() => setSelected(a)}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      <AnimatePresence>
        {creating && (
          <CreateAlbumModal
            onClose={() => setCreating(false)}
            onCreated={(a) => {
              setAlbums((prev) => [a, ...prev]);
              setCreating(false);
              toast.success(`"${a.title}" created`);
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selected && (
          <AlbumDetail album={selected} onClose={() => setSelected(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}

function AlbumCard({
  album,
  onDelete,
  onOpen,
}: {
  album: Album;
  onDelete?: () => void;
  onOpen: () => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -3 }}
      onClick={onOpen}
      className="group relative rounded-2xl overflow-hidden bg-card border border-border/60 cursor-pointer transition-all hover:border-primary/30 hover:shadow-warm"
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        {album.coverImage ? (
          <img src={album.coverImage} alt={album.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
        ) : album.memories?.[0] ? (
          <img src={album.memories[0].url} alt={album.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 via-accent/20 to-primary/10 grid place-items-center">
            <Images className="size-10 text-accent/60" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/0 to-black/0" />
        <div className="absolute top-3 left-3 flex items-center gap-2">
          {album.isPublic ? (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-black/50 text-white backdrop-blur-md inline-flex items-center gap-1">
              <Globe className="size-2.5" /> Public
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-black/50 text-white backdrop-blur-md inline-flex items-center gap-1">
              <Lock className="size-2.5" /> Private
            </span>
          )}
        </div>
        <div className="absolute bottom-3 left-3 right-3 text-white">
          <h3 className="font-display text-lg font-semibold leading-tight drop-shadow-md line-clamp-2">
            {album.title}
          </h3>
        </div>
      </div>

      <div className="p-4">
        {album.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 mb-3 leading-relaxed">
            {album.description}
          </p>
        )}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <ImageIcon className="size-3" />
            {album.memories?.length || 0} photos
          </span>
          {album.user && (
            <span className="text-[10px]">by {album.user.name}</span>
          )}
        </div>
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
            aria-label="Delete album"
          >
            <Trash2 className="size-3.5" />
          </button>
        )}
      </div>
    </motion.div>
  );
}

function AlbumDetail({ album, onClose }: { album: Album; onClose: () => void }) {
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
        className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-card border border-border/60 rounded-3xl shadow-warm"
      >
        <button onClick={onClose} className="absolute top-4 right-4 size-8 grid place-items-center rounded-full hover:bg-muted z-10" aria-label="Close">
          <X className="size-4" />
        </button>
        <div className="p-6 lg:p-8">
          <div className="text-xs text-muted-foreground mb-2 flex items-center gap-2">
            <Sparkles className="size-3 text-accent" />
            <span>Album · {album.memories?.length || 0} memories</span>
          </div>
          <h2 className="font-display text-2xl lg:text-3xl font-semibold mb-4">{album.title}</h2>
          {album.description && (
            <p className="font-serif text-base leading-relaxed mb-6 text-muted-foreground">{album.description}</p>
          )}

          <div className="vintage-divider mb-6" />

          {album.memories?.length > 0 ? (
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
              {album.memories.map((m) => (
                <div key={m.id} className="rounded-2xl overflow-hidden border border-border/60 group">
                  {m.type === "VIDEO" ? (
                    <video src={m.url} controls className="w-full aspect-square object-cover bg-black" />
                  ) : (
                    <img src={m.url} alt={m.caption || ""} className="w-full aspect-square object-cover transition-transform duration-700 group-hover:scale-105" />
                  )}
                  {m.caption && (
                    <div className="p-2 text-xs text-muted-foreground font-serif italic">
                      {m.caption}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              This album is empty.
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

function CreateAlbumModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (album: Album) => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [uploaded, setUploaded] = useState<{ url: string; type: string }[]>([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const handleFiles = async (newFiles: File[]) => {
    if (!newFiles.length) return;
    setUploading(true);
    try {
      const result = await api.upload(newFiles);
      setUploaded((prev) => [...prev, ...result.files.map((f) => ({ url: f.url, type: f.type }))]);
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
      toast.error("Give your album a title");
      return;
    }
    setSaving(true);
    try {
      const cover = uploaded.find((m) => m.type === "IMAGE")?.url || null;
      const result = await api.albums.create({
        title,
        description,
        coverImage: cover,
        isPublic,
        memories: uploaded.map((m) => ({ type: m.type, url: m.url })),
      });
      onCreated(result.album);
    } catch {
      toast.error("Could not create album");
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
            <Images className="size-3.5 text-accent" />
            <span>New album</span>
          </div>
          <h2 className="font-display text-2xl font-semibold mb-6">
            Curate a new collection
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Summer in Lisbon, Morning walks"
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/15 text-sm transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                Description (optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="A few words about this collection..."
                rows={2}
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/15 text-sm transition-all resize-none font-serif"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Photos & videos</label>
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
                  Make this album public
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  Others can browse and appreciate your album in the Discover feed.
                </div>
              </div>
            </label>
          </div>

          <div className="flex items-center justify-end gap-2 mt-6 pt-6 border-t border-border/60">
            <button onClick={onClose} className="px-4 py-2 rounded-full text-sm hover:bg-muted">
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={saving || uploading}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-primary text-primary-foreground text-sm font-medium shadow-warm hover:shadow-glow transition-all disabled:opacity-60"
            >
              {saving ? (
                <><Loader2 className="size-4 animate-spin" /> Creating...</>
              ) : (
                <><Images className="size-4" /> Create album</>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
