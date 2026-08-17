"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  UserPlus,
  Search,
  Loader2,
  X,
  Mail,
  Check,
  Clock,
  Inbox,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { api, SessionUser } from "@/lib/api";
import { useSession } from "next-auth/react";

type FriendsResponse = {
  friends: SessionUser[];
  incoming: { id: string; sender: SessionUser }[];
  outgoing: { id: string; receiver: SessionUser }[];
  search: SessionUser[];
};

export function FriendsView() {
  const { data: session } = useSession();
  const user = session?.user;
  const [data, setData] = useState<FriendsResponse>({
    friends: [],
    incoming: [],
    outgoing: [],
    search: [],
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [inviting, setInviting] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [showInvite, setShowInvite] = useState(false);

  const load = () => {
    if (!user) return;
    setLoading(true);
    api.friends
      .list(user.id)
      .then((r) => setData(r as FriendsResponse))
      .catch(() => toast.error("Could not load friends"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    let active = true;
    if (!user) return;
    const run = async () => {
      try {
        const r = await api.friends.list();
        if (active) {
          setData(r as FriendsResponse);
          setLoading(false);
        }
      } catch {
        if (active) {
          toast.error("Could not load friends");
          setLoading(false);
        }
      }
    };
    run();
    return () => { active = false; };
  }, [user]);

  // Debounced search
  useEffect(() => {
    if (!user) return;
    const q = searchQuery.trim();
    if (!q) return;
    const t = setTimeout(() => {
      api.friends.list().then((r) => {
        setData(r as FriendsResponse);
      });
    }, 250);
    return () => clearTimeout(t);
  }, [searchQuery, user]);

  const handleInvite = async () => {
    if (!user) return;
    if (!inviteEmail.trim()) {
      toast.error("Enter your friend's email");
      return;
    }
    setInviting(true);
    try {
      await api.friends.invite(inviteEmail.trim());
      toast.success("Friend request sent");
      setInviteEmail("");
      setShowInvite(false);
      load();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Could not send invite";
      toast.error(msg);
    } finally {
      setInviting(false);
    }
  };

  const handleAccept = async (id: string) => {
    if (!user) return;
    try {
      await api.friends.accept(id);
      toast.success("Friend added");
      load();
    } catch {
      toast.error("Could not accept request");
    }
  };

  const handleDecline = async (id: string) => {
    if (!user) return;
    try {
      await api.friends.decline(id);
      toast.success("Request declined");
      load();
    } catch {
      toast.error("Could not decline request");
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <div className="text-sm text-muted-foreground mb-1 flex items-center gap-2">
            <Users className="size-3.5 text-accent" />
            <span>Friends</span>
          </div>
          <h1 className="font-display text-3xl lg:text-4xl font-semibold tracking-tight">
            People you <span className="text-gradient-warm italic">remember with</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Share capsules, open memories together, and walk each other through time.
          </p>
        </div>
        <button
          onClick={() => setShowInvite(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-primary-foreground font-medium text-sm shadow-warm hover:shadow-glow transition-all hover:-translate-y-0.5"
        >
          <UserPlus className="size-4" />
          Invite friend
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-8">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <input
          type="email"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by email or name..."
          className="w-full pl-11 pr-4 py-3 rounded-full bg-card border border-border focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/15 text-sm transition-all"
        />
      </div>

      {/* Incoming requests */}
      {data.incoming.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <Inbox className="size-4 text-accent" />
            <h2 className="font-display text-lg font-semibold">Pending requests</h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-accent/15 text-accent">
              {data.incoming.length}
            </span>
          </div>
          <div className="space-y-2">
            {data.incoming.map((req) => (
              <motion.div
                key={req.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3 p-3 rounded-2xl bg-card border border-border/60"
              >
                <Avatar name={req.sender.name} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{req.sender.name}</div>
                  <div className="text-xs text-muted-foreground truncate">{req.sender.email}</div>
                </div>
                <button
                  onClick={() => handleAccept(req.id)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-medium hover:shadow-glow transition-all"
                >
                  <Check className="size-3.5" /> Accept
                </button>
                <button
                  onClick={() => handleDecline(req.id)}
                  className="px-3 py-1.5 rounded-full border border-border text-xs hover:bg-muted transition-colors"
                >
                  Decline
                </button>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Outgoing requests */}
      {data.outgoing.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="size-4 text-muted-foreground" />
            <h2 className="font-display text-lg font-semibold">Sent requests</h2>
          </div>
          <div className="space-y-2">
            {data.outgoing.map((req) => (
              <div
                key={req.id}
                className="flex items-center gap-3 p-3 rounded-2xl bg-muted/30 border border-dashed border-border/60"
              >
                <Avatar name={req.receiver.name} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{req.receiver.name}</div>
                  <div className="text-xs text-muted-foreground truncate">{req.receiver.email}</div>
                </div>
                <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
                  <Clock className="size-3" /> Awaiting reply
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Search results */}
      {searchQuery.trim() && data.search.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <Search className="size-4 text-muted-foreground" />
            <h2 className="font-display text-lg font-semibold">Found on NostalgiaNet++</h2>
          </div>
          <div className="space-y-2">
            {data.search.map((s) => (
              <div key={s.id} className="flex items-center gap-3 p-3 rounded-2xl bg-card border border-border/60">
                <Avatar name={s.name} avatar={s.avatar} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{s.name}</div>
                  <div className="text-xs text-muted-foreground truncate">{s.email}</div>
                </div>
                <button
                  onClick={() => {
                    setInviteEmail(s.email);
                    setShowInvite(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border text-xs hover:border-primary/40 transition-colors"
                >
                  <UserPlus className="size-3.5" /> Invite
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Friends list */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="size-4 text-accent" />
          <h2 className="font-display text-lg font-semibold">Your circle</h2>
          <span className="text-xs text-muted-foreground">
            {data.friends.length} {data.friends.length === 1 ? "friend" : "friends"}
          </span>
        </div>

        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 rounded-2xl bg-muted/40 animate-pulse" />
            ))}
          </div>
        ) : data.friends.length === 0 ? (
          <div className="text-center py-16 px-6 rounded-3xl border border-dashed border-border/60 bg-muted/30">
            <div className="size-16 mx-auto mb-4 rounded-2xl bg-card border border-border/60 grid place-items-center">
              <Users className="size-7 text-accent" />
            </div>
            <h3 className="font-display text-xl font-semibold mb-1">Your circle is small but growing</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
              Invite a friend by email. When they accept, you'll be able to share capsules and remember together.
            </p>
            <button
              onClick={() => setShowInvite(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-primary-foreground font-medium text-sm shadow-warm hover:shadow-glow transition-all"
            >
              <UserPlus className="size-4" />
              Send your first invite
            </button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {data.friends.map((f) => (
              <motion.div
                key={f.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="group p-4 rounded-2xl bg-card border border-border/60 hover:border-primary/30 hover:shadow-warm transition-all"
              >
                <div className="flex items-center gap-3">
                  <Avatar name={f.name} avatar={f.avatar} size="lg" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{f.name}</div>
                    <div className="text-xs text-muted-foreground truncate">{f.email}</div>
                  </div>
                </div>
                {f.bio && (
                  <p className="mt-3 text-xs text-muted-foreground font-serif italic line-clamp-2">
                    &ldquo;{f.bio}&rdquo;
                  </p>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* Invite modal */}
      <AnimatePresence>
        {showInvite && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] grid place-items-center p-4"
          >
            <div className="absolute inset-0 bg-background/70 backdrop-blur-md" onClick={() => setShowInvite(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              className="relative w-full max-w-md bg-card border border-border/60 rounded-3xl shadow-warm p-7"
            >
              <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-primary via-accent to-primary opacity-70" />
              <button onClick={() => setShowInvite(false)} className="absolute top-4 right-4 size-8 grid place-items-center rounded-full hover:bg-muted" aria-label="Close">
                <X className="size-4" />
              </button>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <Mail className="size-3.5 text-accent" />
                <span>Send an invitation</span>
              </div>
              <h2 className="font-display text-2xl font-semibold mb-2">Invite a friend</h2>
              <p className="text-sm text-muted-foreground mb-5">
                Enter their email. If they're on NostalgiaNet++, they'll get your request right away.
              </p>
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="friend@example.com"
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/15 text-sm"
              />
              <div className="flex items-center justify-end gap-2 mt-5">
                <button onClick={() => setShowInvite(false)} className="px-4 py-2 rounded-full text-sm hover:bg-muted">
                  Cancel
                </button>
                <button
                  onClick={handleInvite}
                  disabled={inviting}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-primary text-primary-foreground text-sm font-medium shadow-warm hover:shadow-glow transition-all disabled:opacity-60"
                >
                  {inviting ? (
                    <><Loader2 className="size-4 animate-spin" /> Sending...</>
                  ) : (
                    <><UserPlus className="size-4" /> Send invite</>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Avatar({ name, avatar, size = "md" }: { name: string; avatar?: string | null; size?: "md" | "lg" }) {
  const sz = size === "lg" ? "size-12" : "size-10";
  const textSz = size === "lg" ? "text-base" : "text-sm";
  if (avatar) {
    return <img src={avatar} alt={name} className={`${sz} rounded-full object-cover`} />;
  }
  return (
    <div className={`${sz} rounded-full bg-gradient-to-br from-primary to-accent grid place-items-center text-primary-foreground font-semibold ${textSz}`}>
      {name?.[0]?.toUpperCase() || "?"}
    </div>
  );
}
