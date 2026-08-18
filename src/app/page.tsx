"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { LandingNav } from "@/components/nostalgia/landing-nav";
import { LandingHero } from "@/components/nostalgia/landing-hero";
import { LandingFeatures } from "@/components/nostalgia/landing-features";
import { LandingHow } from "@/components/nostalgia/landing-how";
import { LandingTestimonials } from "@/components/nostalgia/landing-testimonials";
import { LandingPricing } from "@/components/nostalgia/landing-pricing";
import { LandingFooter } from "@/components/nostalgia/landing-footer";
import { LandingFaq } from "@/components/nostalgia/landing-faq";
import { ReviewSlider } from "@/components/nostalgia/review-slider";
import { AuthModal } from "@/components/nostalgia/auth-modal";
import { AppShell } from "@/components/nostalgia/app-shell";
import { Logo } from "@/components/icons/logo";
import { Sparkles, Hammer } from "lucide-react";

export default function Home() {
  const { data: session, status } = useSession();
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("signup");
  // Track if user just submitted auth — we render a loading screen
  // while the session is fetched to avoid flashing the landing page.
  const [justAuthed, setJustAuthed] = useState(false);

  // Read URL flags once on mount. This runs AFTER hydration so window is
  // available, and the resulting setState calls are wrapped in a guard
  // to avoid the React 19 "set-state-in-effect" warning.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const authed = params.get("authed") === "1";
    const authParam = params.get("auth");
    const wantOpen = authParam === "login" || authParam === "signup";

    // Strip the flags so reloads don't re-trigger them
    if (authed || wantOpen) {
      params.delete("authed");
      params.delete("auth");
      const newUrl = params.toString()
        ? `${window.location.pathname}?${params.toString()}`
        : window.location.pathname;
      window.history.replaceState({}, "", newUrl);
    }

    // Apply the flags to state. We do this synchronously inside the effect
    // because we WANT a re-render before paint to show the loading screen /
    // open the modal. React 19's "set-state-in-effect" rule is a perf hint,
    // not a correctness rule — this is the documented escape hatch.
    /* eslint-disable react-hooks/set-state-in-effect */
    if (authed) {
      setJustAuthed(true);
    }
    if (wantOpen) {
      setAuthMode(authParam as "login" | "signup");
      setAuthOpen(true);
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  const handleGetStarted = (mode: "login" | "signup" = "signup") => {
    setAuthMode(mode);
    setAuthOpen(true);
  };

  // Track whether the user has ever been fully authenticated this session.
  // This prevents a landing-page flash when update() briefly clears session.user
  // (e.g., after uploading a profile picture) while status stays "authenticated".
  const [everAuthenticated, setEverAuthenticated] = useState(false);
  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      /* eslint-disable react-hooks/set-state-in-effect */
      setEverAuthenticated(true);
      /* eslint-enable react-hooks/set-state-in-effect */
    }
  }, [status, session]);

  // If logged in, show the app shell
  if (status === "authenticated" && session?.user) {
    return <AppShell />;
  }

  // If we were authenticated and the session is transitioning (update() in flight),
  // show the loading screen instead of the landing page.
  if (everAuthenticated && status !== "unauthenticated") {
    return <AuthLoadingScreen />;
  }

  // If user just submitted auth, show a loading screen while session loads.
  if (justAuthed && status === "loading") {
    return <AuthLoadingScreen />;
  }

  // Also show loading screen on initial mount while session is being fetched,
  // so a logged-in user doesn't see the landing page flash before redirect.
  if (status === "loading" && !authOpen) {
    return <AuthLoadingScreen />;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <LandingNav onGetStarted={() => handleGetStarted("signup")} />
      <main className="flex-1 pt-20">
        <LandingHero onGetStarted={() => handleGetStarted("signup")} />
        <LandingFeatures />
        <LandingHow />
        <LandingTestimonials />
        <LandingPricing onGetStarted={() => handleGetStarted("signup")} />
        <ReviewSlider />
        <LandingFaq />
        <UnderConstructionBanner />
      </main>
      <LandingFooter />
      <AuthModal
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        initialMode={authMode}
      />
    </div>
  );
}

function AuthLoadingScreen() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-float-slow">
          <Logo className="size-14" />
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <div className="size-2 rounded-full bg-accent animate-pulse" />
          <div className="size-2 rounded-full bg-accent animate-pulse" style={{ animationDelay: "150ms" }} />
          <div className="size-2 rounded-full bg-accent animate-pulse" style={{ animationDelay: "300ms" }} />
          <span className="ml-2 font-serif italic">Opening your memories…</span>
        </div>
      </div>
    </div>
  );
}

function UnderConstructionBanner() {
  return (
    <section className="relative py-24 lg:py-32 bg-muted/40">
      <div className="container mx-auto px-6 lg:px-12">
        <div className="max-w-2xl mx-auto text-center p-8 lg:p-12 rounded-3xl bg-card border border-accent/30">
          <div className="size-14 mx-auto mb-5 rounded-2xl bg-accent/15 grid place-items-center">
            <Hammer className="size-7 text-accent" />
          </div>
          <h2 className="font-display text-3xl lg:text-4xl font-semibold tracking-tight mb-3">
            Under <span className="text-gradient-warm italic">construction</span>
          </h2>
          <p className="text-muted-foreground font-serif text-base lg:text-lg leading-relaxed max-w-xl mx-auto mb-4">
            NostalgiaNet++ is in early access. While we&apos;re building,
            every user can upload up to <strong className="text-foreground">3 photos per day</strong> for free.
            Paid plans arrive in January 2027 with unlimited uploads, video, and more.
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent text-xs font-medium">
            <Sparkles className="size-3" />
            <span>Free until January 2027</span>
          </div>
        </div>
      </div>
    </section>
  );
}
