export type SessionUser = {
  id: string;
  name: string;
  email: string;
  avatar?: string | null;
  bio?: string | null;
  plan?: string;
  role?: string; // USER | ADMIN
};

export type Memory = {
  id: string;
  type: string;
  url: string;
  caption: string | null;
  order: number;
};

export type Vault = {
  id: string;
  title: string;
  description: string | null;
  coverImage: string | null;
  unlockAt: string;
  isPublic: boolean;
  isSealed: boolean;
  category: string | null;
  createdAt: string;
  userId: string;
  memories: Memory[];
  user?: { name: string; avatar: string | null };
  // Populated on public pages (discover, /v/[id]) via Prisma _count.reactions
  reactionCount?: number;
  // Optional role flag — set when fetched via scope=mine, indicates whether
  // the current user owns the vault or is a contributor on it.
  _role?: "owner" | "contributor";
};

export type Album = {
  id: string;
  title: string;
  description: string | null;
  coverImage: string | null;
  isPublic: boolean;
  createdAt: string;
  userId: string;
  memories: Memory[];
  user?: { name: string; avatar: string | null };
};

export type Journal = {
  id: string;
  title: string;
  content: string;
  mood: string | null;
  weather: string | null;
  location: string | null;
  tags: string | null;
  createdAt: string;
  updatedAt: string;
  userId: string;
};

export type NotificationItem = {
  id: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  link: string | null;
  createdAt: string;
};

async function request<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };
  if (options.body && !(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }
  const res = await fetch(url, { ...options, headers, credentials: "same-origin" });
  const data = await res.json();
  if (!res.ok) {
    throw new Error((data as { error?: string }).error || "Request failed");
  }
  return data as T;
}

export const api = {
  vaults: {
    list: (scope: "mine" | "public" | "shared" = "mine", opts?: { q?: string; sort?: string; category?: string }) => {
      const params = new URLSearchParams();
      if (scope) params.set("scope", scope);
      if (opts?.q) params.set("q", opts.q);
      if (opts?.sort) params.set("sort", opts.sort);
      if (opts?.category) params.set("category", opts.category);
      const qs = params.toString();
      return request<{ vaults: Vault[]; contributedVaultIds?: string[] }>(
        `/api/vaults${qs ? `?${qs}` : ""}`
      );
    },
    create: (body: {
      title: string;
      description?: string | null;
      coverImage?: string | null;
      unlockAt: string;
      isPublic?: boolean;
      category?: string;
      memories?: { type: string; url: string; caption?: string }[];
    }) => request<{ vault: Vault }>("/api/vaults", { method: "POST", body: JSON.stringify(body) }),
    addMemories: (
      vaultId: string,
      memories: { type: string; url: string; caption?: string }[]
    ) =>
      request<{ ok: boolean; added: number; vault: Vault }>(
        `/api/vaults/${vaultId}/memories`,
        { method: "POST", body: JSON.stringify({ memories }) }
      ),
    delete: (id: string) =>
      request<{ ok: boolean }>(`/api/vaults?id=${id}`, { method: "DELETE" }),
  },
  albums: {
    list: (scope: "mine" | "public" = "mine") =>
      request<{ albums: Album[] }>(`/api/albums?scope=${scope}`),
    create: (body: {
      title: string;
      description?: string | null;
      coverImage?: string | null;
      isPublic?: boolean;
      memories?: { type: string; url: string; caption?: string }[];
    }) => request<{ album: Album }>("/api/albums", { method: "POST", body: JSON.stringify(body) }),
    delete: (id: string) =>
      request<{ ok: boolean }>(`/api/albums?id=${id}`, { method: "DELETE" }),
  },
  journals: {
    list: () => request<{ journals: Journal[] }>("/api/journals"),
    create: (body: {
      title: string;
      content: string;
      mood?: string;
      weather?: string;
      location?: string;
      tags?: string;
    }) =>
      request<{ journal: Journal }>("/api/journals", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    delete: (id: string) =>
      request<{ ok: boolean }>(`/api/journals?id=${id}`, { method: "DELETE" }),
  },
  friends: {
    list: (q?: string) =>
      request<{
        friends: SessionUser[];
        incoming: { id: string; sender: SessionUser }[];
        outgoing: { id: string; receiver: SessionUser }[];
        search: SessionUser[];
      }>(`/api/friends${q ? `?q=${encodeURIComponent(q)}` : ""}`),
    invite: (receiverEmail: string) =>
      request<{ friendship: unknown }>("/api/friends", {
        method: "POST",
        body: JSON.stringify({ action: "invite", receiverEmail }),
      }),
    accept: (requestId: string) =>
      request<{ ok: boolean; status: string }>("/api/friends", {
        method: "POST",
        body: JSON.stringify({ action: "accept", requestId }),
      }),
    decline: (requestId: string) =>
      request<{ ok: boolean; status: string }>("/api/friends", {
        method: "POST",
        body: JSON.stringify({ action: "decline", requestId }),
      }),
  },
  share: {
    list: (vaultId?: string) =>
      request<{ shares?: { id: string; recipient: SessionUser }[]; shared?: { id: string; vault: Vault; sharer: SessionUser }[] }>(
        vaultId ? `/api/share?vaultId=${vaultId}` : "/api/share"
      ),
    create: (vaultId: string, friendIds: string[]) =>
      request<{ ok: boolean; shared: number; skipped: number }>("/api/share", {
        method: "POST",
        body: JSON.stringify({ vaultId, friendIds }),
      }),
    revoke: (id: string) =>
      request<{ ok: boolean }>(`/api/share?id=${id}`, { method: "DELETE" }),
  },
  notifications: {
    list: () =>
      request<{ notifications: NotificationItem[]; unread: number }>("/api/notifications"),
    markAllRead: () =>
      request<{ ok: boolean }>("/api/notifications", {
        method: "PATCH",
        body: JSON.stringify({ all: true }),
      }),
    markRead: (id: string) =>
      request<{ ok: boolean }>("/api/notifications", {
        method: "PATCH",
        body: JSON.stringify({ id }),
      }),
  },
  upload: async (files: File[]) => {
    const formData = new FormData();
    files.forEach((f) => formData.append("files", f));
    return request<{ files: { url: string; type: string; name: string; size: number }[] }>(
      "/api/upload",
      { method: "POST", body: formData }
    );
  },
};
