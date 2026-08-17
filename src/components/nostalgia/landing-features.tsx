"use client";

import { motion } from "framer-motion";
import {
  Lock,
  CalendarHeart,
  Images,
  Users,
  BookHeart,
  Bell,
  Shield,
  Sparkles,
} from "lucide-react";

const FEATURES = [
  {
    icon: Lock,
    title: "Sealed TimeVaults",
    desc: "Upload photos, videos, and notes into a vault. Lock it with a future unlock date — not even you can peek before time is up.",
    accent: "from-amber-500/15 to-rose-500/10",
  },
  {
    icon: CalendarHeart,
    title: "Memory Calendar",
    desc: "See every upcoming unlock at a glance. Watch the countdown tick toward the day your past self becomes a surprise.",
    accent: "from-rose-500/15 to-amber-500/10",
  },
  {
    icon: BookHeart,
    title: "Living Journals",
    desc: "Write entries with mood, weather, location, and tags. A beautiful timeline of your inner weather across the years.",
    accent: "from-orange-500/15 to-yellow-500/10",
  },
  {
    icon: Users,
    title: "Friends & Shared Vaults",
    desc: "Send a friend request by email. Co-create capsules together. Open the same memory on the same future day.",
    accent: "from-amber-600/15 to-orange-500/10",
  },
  {
    icon: Bell,
    title: "Gentle Reminders",
    desc: "We nudge you the day a vault unlocks. No spam — just a warm notification that today is the day.",
    accent: "from-rose-500/15 to-orange-500/10",
  },
  {
    icon: Shield,
    title: "Private by default",
    desc: "Your memories live on your account, never sold, never trained on. Public capsules are opt-in, never default.",
    accent: "from-amber-500/15 to-rose-500/10",
  },
];

export function LandingFeatures() {
  return (
    <section id="features" className="relative py-24 lg:py-32">
      <div className="container mx-auto px-6 lg:px-12">
        <div className="max-w-2xl mx-auto text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-medium mb-4"
          >
            <Sparkles className="size-3" />
            <span>Everything you need to remember</span>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7, delay: 0.05 }}
            className="font-display text-4xl lg:text-5xl font-semibold tracking-tight"
          >
            Built for{" "}
            <span className="text-gradient-warm italic">memory-keepers</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="mt-5 text-muted-foreground font-serif text-lg leading-relaxed"
          >
            NostalgiaNet++ bundles every tool you need to capture, seal, and
            rediscover the moments that shape your life — all in one warm,
            intentional space.
          </motion.p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.55, delay: i * 0.05 }}
              className="group relative p-6 rounded-3xl bg-card border border-border/60 hover:border-primary/30 transition-all hover:-translate-y-1 hover:shadow-warm"
            >
              <div
                className={`size-12 rounded-2xl grid place-items-center bg-gradient-to-br ${f.accent} mb-5`}
              >
                <f.icon className="size-6 text-accent" />
              </div>
              <h3 className="font-display text-xl font-semibold mb-2">
                {f.title}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {f.desc}
              </p>
              <div className="mt-5 inline-flex items-center gap-1.5 text-xs font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                <Images className="size-3" />
                <span>Learn more</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
