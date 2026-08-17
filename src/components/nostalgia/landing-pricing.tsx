"use client";

import { motion } from "framer-motion";
import { Check, Sparkles } from "lucide-react";

const PLANS = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    desc: "Begin your first capsule today.",
    features: [
      "Up to 3 active capsules",
      "100 MB storage",
      "Photos & notes",
      "Memory calendar",
      "Basic journaling",
    ],
    cta: "Get started",
    highlight: false,
  },
  {
    name: "Keeper",
    price: "$3",
    period: "/month",
    desc: "For the memory-keeper who's all in.",
    features: [
      "Unlimited capsules",
      "10 GB storage",
      "Videos included",
      "Friends & shared capsules",
      "Advanced mood timeline",
      "Early access to new features",
    ],
    cta: "Start Keeper",
    highlight: true,
  },
  {
    name: "Family",
    price: "$6",
    period: "/month",
    desc: "A shared vault for the whole family.",
    features: [
      "Everything in Keeper",
      "50 GB storage",
      "Up to 6 family members",
      "Shared family capsules",
      "Memory recap each year",
      "Priority support",
    ],
    cta: "Start Family",
    highlight: false,
  },
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
            Free forever to start. Upgrade only if you fall in love. Cancel
            anytime — your memories always stay yours.
          </motion.p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {PLANS.map((p, i) => (
            <motion.div
              key={p.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.55, delay: i * 0.08 }}
              className={`relative p-7 rounded-3xl border transition-all hover:-translate-y-1 ${
                p.highlight
                  ? "bg-card border-primary/40 shadow-warm scale-[1.02]"
                  : "bg-card border-border/60 hover:border-primary/30"
              }`}
            >
              {p.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-primary text-primary-foreground text-[10px] font-semibold tracking-wide uppercase">
                  Most loved
                </div>
              )}
              <div className="mb-2 font-display text-xl font-semibold">{p.name}</div>
              <div className="text-sm text-muted-foreground mb-5">{p.desc}</div>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="font-display text-4xl font-semibold text-gradient-warm">
                  {p.price}
                </span>
                <span className="text-sm text-muted-foreground">{p.period}</span>
              </div>
              <ul className="space-y-2.5 mb-7">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm">
                    <Check className="size-4 text-accent mt-0.5 shrink-0" />
                    <span className="text-foreground/85">{f}</span>
                  </li>
                ))}
              </ul>
              <button
                onClick={onGetStarted}
                className={`w-full py-3 rounded-full font-medium text-sm transition-all ${
                  p.highlight
                    ? "bg-primary text-primary-foreground shadow-warm hover:shadow-glow"
                    : "border border-border bg-background hover:border-primary/40"
                }`}
              >
                {p.cta}
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
