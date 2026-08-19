"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { signIn } from "next-auth/react";
import { X, Mail, Lock, User, Loader2, ArrowRight, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Logo } from "@/components/icons/logo";

export function AuthModal({
  open,
  onClose,
  initialMode = "signup",
}: {
  open: boolean;
  onClose: () => void;
  initialMode?: "login" | "signup";
}) {
  const router = useRouter();
  const [authMode, setAuthMode] = useState<"login" | "signup">(initialMode);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Pre-flight validation before calling NextAuth signIn().
  // NextAuth's signIn({redirect:false}) returns a generic "CredentialsSignin"
  // error code on failure, swallowing our actual error message ("An account
  // with this email already exists", "Invalid email or password", etc.).
  // To surface real errors, we do our own validation first.
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Basic client-side validation
    if (authMode === "signup") {
      if (!name.trim() || name.trim().length < 2) {
        toast.error("Please tell us your name (at least 2 characters)");
        setLoading(false);
        return;
      }
      if (password.length < 6) {
        toast.error("Password must be at least 6 characters");
        setLoading(false);
        return;
      }
    }

    try {
      // Capture ?ref=<inviterId> from URL if present (referral program)
      const refFromUrl =
        typeof window !== "undefined"
          ? new URLSearchParams(window.location.search).get("ref")
          : null;

      // Pre-flight: hit our own validation endpoint so we can show real
      // error messages (NextAuth swallows them otherwise).
      // NOTE: this endpoint is at /api/precheck (not /api/auth/precheck) because
      // NextAuth's catch-all [...nextauth] route would intercept any /api/auth/* path.
      const preFlightRes = await fetch("/api/precheck", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: authMode,
          email,
          password,
          name: authMode === "signup" ? name : undefined,
        }),
      });
      const preFlightData = await preFlightRes.json();
      if (!preFlightRes.ok) {
        toast.error(preFlightData.error || "Validation failed");
        setLoading(false);
        return;
      }

      // Pre-flight passed — now call NextAuth signIn.
      // We use redirect:false and check the result; on failure we fall back to
      // a generic message because NextAuth won't tell us the real reason.
      const result = await signIn("credentials", {
        redirect: false,
        mode: authMode,
        name,
        email,
        password,
        ...(authMode === "signup" && refFromUrl
          ? { invitedById: refFromUrl }
          : {}),
      });

      if (!result || result.error || !result.ok) {
        // This shouldn't happen since pre-flight passed, but handle gracefully
        toast.error("Authentication failed. Please try again.");
        setLoading(false);
        return;
      }

      toast.success(
        authMode === "signup"
          ? "Welcome! Your journey begins."
          : "Welcome back!"
      );

      // Strip ?ref= from URL so it isn't reused
      if (refFromUrl && typeof window !== "undefined") {
        const url = new URL(window.location.href);
        url.searchParams.delete("ref");
        window.history.replaceState({}, "", url.toString());
      }

      // Navigate to dashboard so useSession() picks up the new cookie.
      // We pass `authed=1` so the page can render a loading screen instead
      // of flashing the landing page during session fetch.
      router.push("/?authed=1");
    } catch (err) {
      toast.error("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    try {
      // Check if the Google provider is actually registered on the server.
      // If GOOGLE_CLIENT_ID isn't set, the provider is omitted in auth-config.ts
      // and /api/auth/providers won't include "google".
      const res = await fetch("/api/auth/providers");
      const data = await res.json();
      const hasGoogle = !!(data && data.google);

      if (!hasGoogle) {
        toast.info(
          "Google sign-in is coming soon! Please sign up manually for now — it takes less than a minute.",
          { duration: 6000 }
        );
        setLoading(false);
        return;
      }

      // Await DB warm-up before redirecting to Google.
      // We race the actual warmup response against a 2500ms safety timeout
      // so we never hang the flow if Neon is slow — but we also don't just
      // guess with a fixed delay. The button spinner covers this wait.
      const warmup = fetch("/api/warmup").catch(() => null);
      const timeout = new Promise<null>((r) => setTimeout(() => r(null), 2500));
      await Promise.race([warmup, timeout]);

      await signIn("google", { callbackUrl: "/?authed=1" });
    } catch {
      toast.error("Google sign-in failed");
      setLoading(false);
    }
  };

  const handleDemo = async () => {
    setLoading(true);
    const demoEmail = `demo-${Date.now()}@nostalgia.net`;
    const demoPassword = "demoPass123";
    try {
      // Demo mode = signup directly (no pre-flight needed since email is unique)
      const result = await signIn("credentials", {
        redirect: false,
        mode: "signup",
        name: "Demo User",
        email: demoEmail,
        password: demoPassword,
      });
      if (!result || result.error || !result.ok) {
        toast.error("Could not start demo. Try again.");
        setLoading(false);
        return;
      }
      toast.success("Welcome! Your demo account is ready.");
      router.push("/?authed=1");
    } catch {
      toast.error("Could not start demo. Try again.");
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[100] grid place-items-center p-4"
        >
          <div
            className="absolute inset-0 bg-background/70 backdrop-blur-md"
            onClick={() => {
              if (!loading) onClose();
            }}
          />
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97 }}
            transition={{ duration: 0.3, ease: [0.2, 0.8, 0.2, 1] }}
            className="relative w-full max-w-md bg-card border border-border/60 rounded-3xl shadow-warm overflow-hidden"
          >
            <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-primary via-accent to-primary opacity-70" />

            <button
              onClick={() => {
                if (!loading) onClose();
              }}
              className="absolute top-4 right-4 size-8 grid place-items-center rounded-full hover:bg-muted transition-colors z-10 disabled:opacity-50"
              aria-label="Close"
              disabled={loading}
            >
              <X className="size-4" />
            </button>

            <div className="p-7 pt-9">
              <div className="flex items-center gap-2.5 mb-6">
                <Logo className="size-9" />
                <div>
                  <div className="font-display text-lg font-semibold leading-none">
                    Nostalgia<span className="text-accent">Net</span>
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-1">
                    Where memories live forever
                  </div>
                </div>
              </div>

              <h2 className="font-display text-2xl font-semibold mb-1">
                {authMode === "signup" ? "Create an account" : "Welcome back"}
              </h2>
              <p className="text-sm text-muted-foreground mb-6">
                {authMode === "signup"
                  ? "Begin your first capsule in less than a minute."
                  : "Sign in to reopen your sealed moments."}
              </p>

              <form onSubmit={handleSubmit} className="space-y-3">
                {authMode === "signup" && (
                  <Field
                    icon={User}
                    type="text"
                    placeholder="Your name"
                    value={name}
                    onChange={setName}
                    required
                    disabled={loading}
                  />
                )}
                <Field
                  icon={Mail}
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={setEmail}
                  required
                  disabled={loading}
                />
                <Field
                  icon={Lock}
                  type="password"
                  placeholder={authMode === "signup" ? "At least 6 characters" : "Password"}
                  value={password}
                  onChange={setPassword}
                  required
                  disabled={loading}
                />

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-primary-foreground font-medium shadow-warm hover:shadow-glow transition-all hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-wait disabled:translate-y-0"
                >
                  {loading ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <>
                      <span>{authMode === "signup" ? "Create account" : "Sign in"}</span>
                      <ArrowRight className="size-4" />
                    </>
                  )}
                </button>
              </form>

              <div className="relative my-5">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border/60" />
                </div>
                <div className="relative flex justify-center">
                  <span className="px-3 bg-card text-xs text-muted-foreground">or</span>
                </div>
              </div>

              <button
                onClick={handleGoogle}
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl border border-border hover:border-primary/40 transition-colors disabled:opacity-60 mb-2"
              >
                <GoogleIcon className="size-4" />
                <span className="text-sm font-medium">Continue with Google</span>
              </button>

              <button
                onClick={handleDemo}
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl border border-border hover:border-primary/40 transition-colors disabled:opacity-60"
              >
                <Sparkles className="size-4 text-accent" />
                <span className="text-sm font-medium">Explore as demo</span>
              </button>

              <p className="mt-6 text-center text-sm text-muted-foreground">
                {authMode === "signup" ? (
                  <>
                    Already have an account?{" "}
                    <button
                      onClick={() => setAuthMode("login")}
                      disabled={loading}
                      className="text-primary font-medium hover:underline disabled:opacity-50"
                    >
                      Sign in
                    </button>
                  </>
                ) : (
                  <>
                    New here?{" "}
                    <button
                      onClick={() => setAuthMode("signup")}
                      disabled={loading}
                      className="text-primary font-medium hover:underline disabled:opacity-50"
                    >
                      Create an account
                    </button>
                  </>
                )}
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Field({
  icon: Icon,
  type,
  placeholder,
  value,
  onChange,
  required,
  disabled,
}: {
  icon: React.ElementType;
  type: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  disabled?: boolean;
}) {
  return (
    <div className="relative">
      <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        disabled={disabled}
        className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-background/60 focus:bg-background focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/15 transition-all text-sm disabled:opacity-60"
      />
    </div>
  );
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}
