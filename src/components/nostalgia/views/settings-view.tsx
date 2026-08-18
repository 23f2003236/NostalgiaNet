"use client";

import { useState, useRef } from "react";
import {
  Settings,
  User,
  Mail,
  Loader2,
  Save,
  LogOut,
  Sparkles,
  Crown,
  Check,
  Shield,
  Camera,
  Palette,
  Lock,
} from "lucide-react";
import { toast } from "sonner";
import { useSession, signOut } from "next-auth/react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

const THEMES = [
  { key: "sepia", label: "Warm Sepia", desc: "Original", color: "oklch(0.55 0.13 55)", accent: "oklch(0.65 0.13 45)" },
  { key: "ocean", label: "Ocean Blue", desc: "Calm & cool", color: "oklch(0.50 0.15 240)", accent: "oklch(0.60 0.13 200)" },
  { key: "forest", label: "Forest Green", desc: "Earthy", color: "oklch(0.50 0.12 150)", accent: "oklch(0.62 0.13 165)" },
  { key: "rose", label: "Rose Pink", desc: "Romantic", color: "oklch(0.55 0.18 10)", accent: "oklch(0.65 0.15 350)" },
  { key: "midnight", label: "Midnight Purple", desc: "Premium", color: "oklch(0.50 0.18 290)", accent: "oklch(0.62 0.18 320)" },
  { key: "sunset", label: "Sunset Orange", desc: "Vibrant", color: "oklch(0.62 0.20 35)", accent: "oklch(0.65 0.18 20)" },
  { key: "slate", label: "Mono Slate", desc: "Minimal", color: "oklch(0.40 0.015 250)", accent: "oklch(0.55 0.02 250)" },
];

// Helper to apply the chosen theme. Stored in localStorage so the inline
// script in layout.tsx can apply it before hydration (prevents flash).
function applyTheme(themeKey: string) {
  if (typeof window === "undefined") return;
  document.documentElement.setAttribute("data-theme", themeKey);
  try {
    localStorage.setItem("nostalgianet-theme", themeKey);
  } catch {}
}

function getCurrentTheme(): string {
  if (typeof window === "undefined") return "slate";
  return localStorage.getItem("nostalgianet-theme") || "slate";
}

export function SettingsView() {
  const { data: session, update } = useSession();
  const user = session?.user;
  const { theme: colorMode, setTheme: setColorMode } = useTheme();
  const [name, setName] = useState(user?.name || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [avatar, setAvatar] = useState<string | null>(user?.avatar || null);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState(getCurrentTheme);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/user", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, bio, avatar }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update");
      }
      await update();
      toast.success("Profile updated", { duration: 6000 });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save");
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (file: File) => {
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) {
      toast.error("Profile picture must be under 4 MB", { duration: 6000 });
      return;
    }
    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append("files", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      const newAvatar = data.files[0].url;
      setAvatar(newAvatar);
      // Save immediately so the avatar persists
      const updateRes = await fetch("/api/user", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatar: newAvatar }),
      });
      if (!updateRes.ok) throw new Error("Could not save avatar");
      await update();
      toast.success("Profile picture updated", { duration: 6000 });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed", { duration: 6000 });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleThemeChange = (key: string) => {
    setSelectedTheme(key);
    applyTheme(key);
    toast.success(`Theme changed to ${THEMES.find((t) => t.key === key)?.label || key}`, { duration: 6000 });
  };

  const plan = user?.plan || "FREE";
  const isAdmin = user?.role === "ADMIN";

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <div className="text-sm text-muted-foreground mb-1 flex items-center gap-2">
          <Settings className="size-3.5 text-accent" />
          <span>Settings</span>
        </div>
        <h1 className="font-display text-3xl lg:text-4xl font-semibold tracking-tight">
          Your <span className="text-gradient-warm italic">profile</span>
        </h1>
      </div>

      <div className="space-y-6">
        {/* Profile card with avatar upload */}
        <div className="bg-card border border-border/60 rounded-3xl p-6">
          <h2 className="font-display text-lg font-semibold mb-4 flex items-center gap-2">
            <User className="size-4 text-accent" />
            Profile
          </h2>

          <div className="flex items-center gap-4 mb-5">
            <div className="relative">
              <div className="size-20 rounded-full bg-gradient-to-br from-primary to-accent grid place-items-center text-primary-foreground font-display text-3xl font-semibold overflow-hidden">
                {avatar ? (
                  <img src={avatar} alt={name} className="w-full h-full object-cover" />
                ) : (
                  name?.[0]?.toUpperCase() || "U"
                )}
              </div>
              {/* Camera button overlay */}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="absolute -bottom-1 -right-1 size-8 rounded-full bg-card border-2 border-background shadow-warm grid place-items-center hover:bg-muted transition-colors disabled:opacity-60"
                aria-label="Change profile picture"
                title="Change profile picture"
              >
                {uploadingAvatar ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Camera className="size-3.5" />
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleAvatarUpload(f);
                  e.target.value = "";
                }}
              />
            </div>
            <div>
              <div className="font-medium flex items-center gap-2">
                {name || "Your name"}
                {isAdmin && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-destructive/15 text-destructive text-[10px] font-bold uppercase tracking-wide">
                    <Shield className="size-2.5" /> Admin
                  </span>
                )}
              </div>
              <div className="text-xs text-muted-foreground">{user?.email}</div>
              {plan !== "FREE" && (
                <span className="inline-flex items-center gap-1 mt-1.5 text-[10px] px-2 py-0.5 rounded-full bg-accent/15 text-accent font-medium">
                  <Crown className="size-2.5" />
                  {plan} plan
                </span>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                Display name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/15 text-sm transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                <Mail className="inline size-3.5 mr-1" />
                Email (read-only)
              </label>
              <input
                type="email"
                value={user?.email || ""}
                disabled
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-muted/40 text-sm text-muted-foreground"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                Bio
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="A few words about you..."
                rows={3}
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/15 text-sm transition-all resize-none font-serif"
              />
            </div>
            <div className="flex justify-end">
              <button
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-primary text-primary-foreground text-sm font-medium shadow-warm hover:shadow-glow transition-all disabled:opacity-60"
              >
                {saving ? (
                  <><Loader2 className="size-4 animate-spin" /> Saving...</>
                ) : (
                  <><Save className="size-4" /> Save changes</>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Theme picker */}
        <div className="bg-card border border-border/60 rounded-3xl p-6">
          <h2 className="font-display text-lg font-semibold mb-1 flex items-center gap-2">
            <Palette className="size-4 text-accent" />
            Theme
          </h2>
          <p className="text-xs text-muted-foreground mb-4">
            Pick a palette that feels like home. Changes instantly.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {THEMES.map((t) => (
              <div key={t.key} className="relative group">
                {/* Hover preview card — appears above */}
                <div className="pointer-events-none absolute bottom-full left-0 mb-2 z-30 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                  <div className="bg-card border border-border/80 rounded-xl p-3 shadow-warm w-[140px]">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="size-5 rounded-full border border-border/40" style={{ background: t.color }} />
                      <div className="size-4 rounded-full border border-border/40" style={{ background: t.accent }} />
                    </div>
                    <div className="text-xs font-semibold leading-tight">{t.label}</div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">{t.desc}</div>
                  </div>
                </div>
                <button
                  onClick={() => handleThemeChange(t.key)}
                  className={cn(
                    "relative w-full p-3 rounded-2xl border-2 transition-all text-left",
                    selectedTheme === t.key
                      ? "border-primary shadow-warm"
                      : "border-border hover:border-primary/40"
                  )}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className="size-6 rounded-full"
                      style={{ background: t.color }}
                    />
                    <div
                      className="size-4 rounded-full"
                      style={{ background: t.accent }}
                    />
                  </div>
                  <div className="text-sm font-medium">{t.label}</div>
                  <div className="text-[10px] text-muted-foreground">{t.desc}</div>
                  {selectedTheme === t.key && (
                    <div className="absolute top-2 right-2 size-5 rounded-full bg-primary text-primary-foreground grid place-items-center">
                      <Check className="size-3" />
                    </div>
                  )}
                </button>
              </div>
            ))}
          </div>

          {/* Light/dark mode toggle */}
          <div className="mt-5 flex items-center justify-between p-3 rounded-xl bg-muted/40">
            <div>
              <div className="text-sm font-medium">Color mode</div>
              <div className="text-xs text-muted-foreground">Switch between day and night.</div>
            </div>
            <div className="flex items-center gap-1 p-1 rounded-full bg-card border border-border">
              <button
                onClick={() => setColorMode("light")}
                className={cn(
                  "px-3 py-1 text-xs rounded-full transition-all",
                  colorMode === "light" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                )}
              >
                Day
              </button>
              <button
                onClick={() => setColorMode("dark")}
                className={cn(
                  "px-3 py-1 text-xs rounded-full transition-all",
                  colorMode === "dark" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                )}
              >
                Night
              </button>
            </div>
          </div>
        </div>

        {/* Preferences */}
        <div className="bg-card border border-border/60 rounded-3xl p-6">
          <h2 className="font-display text-lg font-semibold mb-4 flex items-center gap-2">
            <Sparkles className="size-4 text-accent" />
            Preferences
          </h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl bg-muted/40">
              <div>
                <div className="text-sm font-medium">Unlock reminders</div>
                <div className="text-xs text-muted-foreground">A gentle nudge when a vault unlocks.</div>
              </div>
              <span className="text-xs px-2 py-1 rounded-full bg-accent/15 text-accent">Active</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-muted/40">
              <div>
                <div className="text-sm font-medium">Daily upload limit</div>
                <div className="text-xs text-muted-foreground">3 photos/day during construction (lifts Jan 2027)</div>
              </div>
              <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">3/day</span>
            </div>
          </div>
        </div>

        {/* Password change */}
        <div className="bg-card border border-border/60 rounded-3xl p-6">
          <h2 className="font-display text-lg font-semibold mb-4 flex items-center gap-2">
            <Lock className="size-4 text-accent" />
            Change password
          </h2>
          <PasswordChangeForm />
        </div>

        {/* Account */}
        <div className="bg-card border border-border/60 rounded-3xl p-6">
          <h2 className="font-display text-lg font-semibold mb-4">Account</h2>
          <button
            onClick={() => {
              toast.success("Signed out. See you soon!", { duration: 6000 });
              setTimeout(async () => {
                await signOut({ redirect: false });
                window.location.href = window.location.origin + "/";
              }, 500);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border hover:border-destructive/40 hover:text-destructive text-sm transition-colors"
          >
            <LogOut className="size-4" />
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}

function PasswordChangeForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [show, setShow] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("New passwords don't match", { duration: 6000 });
      return;
    }
    if (newPassword.length < 6) {
      toast.error("New password must be at least 6 characters", { duration: 6000 });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/user/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not change password");
      toast.success("Password changed successfully", { duration: 6000 });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not change password", { duration: 6000 });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="relative">
        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <input
          type={show ? "text" : "password"}
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          placeholder="Current password"
          required
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-background focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/15 text-sm transition-all"
        />
      </div>
      <div className="relative">
        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <input
          type={show ? "text" : "password"}
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="New password (at least 6 characters)"
          required
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-background focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/15 text-sm transition-all"
        />
      </div>
      <div className="relative">
        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <input
          type={show ? "text" : "password"}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Confirm new password"
          required
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-background focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/15 text-sm transition-all"
        />
      </div>
      <div className="flex items-center justify-between gap-3">
        <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
          <input
            type="checkbox"
            checked={show}
            onChange={(e) => setShow(e.target.checked)}
            className="accent-primary"
          />
          Show passwords
        </label>
        <button
          type="submit"
          disabled={saving || !currentPassword || !newPassword || !confirmPassword}
          className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-primary text-primary-foreground text-sm font-medium shadow-warm hover:shadow-glow transition-all disabled:opacity-60"
        >
          {saving ? (
            <><Loader2 className="size-4 animate-spin" /> Updating...</>
          ) : (
            <><Lock className="size-4" /> Update password</>
          )}
        </button>
      </div>
    </form>
  );
}
