"use client";

import { motion } from "framer-motion";
import { Check, Sparkles, Lock } from "lucide-react";
import { toast } from "sonner";

const FREE_FEATURES = [
  "3 active TimeVaults",
  "3 photos per day during free phase",
  "Photo Albums & journaling",
  "Friends & shared capsules",
  "Memory calendar & countdowns",
  "7 themes + dark mode included",
];

// Premium features: most visible, 2 blurred as teasers
const PREMIUM_FEATURES: { label: string; blurred?: boolean }[] = [
  { label: "Unlimited TimeVaults & photo uploads" },
  { label: "Video support up to 500 MB per file" },
  { label: "10 GB personal storage" },
  { label: "Collaborative vault invites & sharing" },
  { label: "Priority email support" },
  { label: "Custom vault cover art & personalization", blurred: true },
  { label: "One more thing we're not telling yet", blurred: true },
];

export function LandingPricing({ onGetStarted }: { onGetStarted: () => void }) {
  return (
    <section id="pricing" className="relative py-24 lg:py-32 bg-muted/40">
      <div className="container mx-auto px-6 lg:px-12">
        <div className="max-w-2xl mx-auto text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-4"
          >
            <Sparkles className="size-3" />
            <span>Simple, honest pricing</span>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7, delay: 0.05 }}
            className="font-display text-4xl lg:text-5xl font-semibold tracking-tight"
          >
            Pick your{" "}
            <span className="text-gradient-warm italic">forever-plan</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="mt-5 text-muted-foreground font-serif text-lg"
          >
            Free while we build. One simple upgrade when we&apos;re ready.
            Your memories always stay yours.
          </motion.p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {/* Free tier */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.55 }}
            className="relative p-7 rounded-3xl border bg-card border-border/60 hover:border-primary/30 hover:-translate-y-1 transition-all"
          >
            <div className="mb-2 font-display text-xl font-semibold">Free</div>
            <div className="text-sm text-muted-foreground mb-5">
              Begin your first capsule today. No card required.
            </div>
            <div className="flex items-baseline gap-1 mb-1">
              <span className="font-display text-4xl font-semibold text-gradient-warm">
                $0
              </span>
              <span className="text-sm text-muted-foreground">/ always</span>
            </div>
            <div className="text-xs text-accent font-medium mb-6">
              Free until January 2027
            </div>
            <ul className="space-y-2.5 mb-7">
              {FREE_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm">
                  <Check className="size-4 text-accent mt-0.5 shrink-0" />
                  <span className="text-foreground/85">{f}</span>
                </li>
              ))}
            </ul>
            <button
              onClick={onGetStarted}
              className="w-full py-3 rounded-full font-medium text-sm transition-all border border-border bg-background hover:border-primary/40"
            >
              Get started free
            </button>
          </motion.div>

          {/* $12 Premium — teaser with real feature list */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.55, delay: 0.08 }}
            className="relative p-7 rounded-3xl border bg-card border-primary/40 shadow-warm scale-[1.02] hover:-translate-y-1 transition-all"
          >
            {/* "Coming soon" badge */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-accent text-[10px] font-semibold tracking-wide uppercase text-accent-foreground whitespace-nowrap">
              Coming Jan 2027
            </div>

            {/* Subtle shimmer overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.03] via-transparent to-accent/[0.05] pointer-events-none" />

            <div className="relative">
              <div className="mb-2 font-display text-xl font-semibold">Premium</div>
              <div className="text-sm text-muted-foreground mb-5">
                For memory-keepers who want it all.
              </div>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="font-display text-4xl font-semibold text-gradient-warm">
                  $12
                </span>
                <span className="text-sm text-muted-foreground">/ month</span>
              </div>
              <div className="text-xs text-muted-foreground mb-6">
                Details finalising — announcing January 2027
              </div>

              {/* Feature list — most visible, 2 blurred as teasers */}
              <ul className="space-y-2.5 mb-7">
                {PREMIUM_FEATURES.map((f) => (
                  <li key={f.label} className="flex items-start gap-2.5 text-sm">
                    {f.blurred ? (
                      <Lock className="size-4 text-primary/40 mt-0.5 shrink-0" />
                    ) : (
                      <Check className="size-4 text-accent mt-0.5 shrink-0" />
                    )}
                    <span
                      className={
                        f.blurred
                          ? "text-foreground/85 select-none"
                          : "text-foreground/85"
                      }
                      style={f.blurred ? { filter: "blur(4px)" } : undefined}
                    >
                      {f.label}
                    </span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() =>
                  toast.info(
                    "We'll announce Premium details closer to January 2027. Stay tuned!",
                    { duration: 6000 }
                  )
                }
                className="w-full py-3 rounded-full font-medium text-sm transition-all bg-primary text-primary-foreground shadow-warm hover:shadow-glow"
              >
                Notify me when it launches
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
