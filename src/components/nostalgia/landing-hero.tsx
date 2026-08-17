"use client";

import { motion } from "framer-motion";
import { Clock, Sparkles, Heart, ArrowRight } from "lucide-react";
import { Logo } from "@/components/icons/logo";

export function LandingHero({
  onGetStarted,
}: {
  onGetStarted: () => void;
}) {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Soft gradient backdrop */}
      <div className="absolute inset-0 -z-10 bg-paper" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-transparent via-transparent to-background" />

      {/* Floating decorative polaroids */}
      <FloatingPolaroids />

      <div className="container mx-auto px-6 lg:px-12 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 mb-6 rounded-full glass border border-border/60 text-xs font-medium text-muted-foreground"
          >
            <Sparkles className="size-3.5 text-accent" />
            <span>A digital time capsule for the moments that matter</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.05 }}
            className="font-display text-5xl sm:text-6xl lg:text-7xl font-semibold tracking-tight leading-[1.05]"
          >
            <span className="block text-foreground">For you,</span>
            <span className="block text-gradient-warm italic">years from now.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="mt-7 mx-auto max-w-2xl text-lg lg:text-xl text-muted-foreground font-serif leading-relaxed"
          >
            Seal your cherished photos, videos, and stories inside beautiful time
            capsules. Set an unlock date. Years later, the future-you will thank
            the present-you.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.25 }}
            className="mt-10 flex flex-wrap items-center justify-center gap-4"
          >
            <button
              onClick={onGetStarted}
              className="group relative inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-primary text-primary-foreground font-medium shadow-warm hover:shadow-glow transition-all duration-300 hover:-translate-y-0.5"
            >
              <span>Start your first capsule</span>
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </button>
            <a
              href="#how"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full glass border border-border/60 text-foreground hover:border-primary/40 transition-all"
            >
              <Clock className="size-4 text-accent" />
              <span>See how it works</span>
            </a>
          </motion.div>

          {/* Stats / trust strip */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.5 }}
            className="mt-16 grid grid-cols-3 gap-4 max-w-2xl mx-auto pt-8 vintage-divider"
          >
            <Stat label="Memories sealed" value="42,180" />
            <Stat label="Capsules unlocked" value="8,904" />
            <Stat label="Years of joy" value="∞" />
          </motion.div>
        </div>
      </div>

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 text-xs text-muted-foreground">
        <Logo className="size-4" />
        <span className="font-serif italic">NostalgiaNet++ — where memories live forever</span>
      </div>
    </section>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center pt-6">
      <div className="font-display text-2xl font-semibold text-gradient-warm">
        {value}
      </div>
      <div className="text-xs text-muted-foreground mt-1">{label}</div>
    </div>
  );
}

function FloatingPolaroids() {
  const items = [
    {
      top: "12%",
      left: "8%",
      rotate: -8,
      delay: 0,
      label: "Summer '19",
      bg: "linear-gradient(135deg, oklch(0.85 0.10 70), oklch(0.75 0.13 50))",
    },
    {
      top: "20%",
      right: "10%",
      rotate: 6,
      delay: 1,
      label: "First snow",
      bg: "linear-gradient(135deg, oklch(0.85 0.05 250), oklch(0.75 0.10 220))",
    },
    {
      bottom: "18%",
      left: "12%",
      rotate: 5,
      delay: 2,
      label: "Grandma's house",
      bg: "linear-gradient(135deg, oklch(0.85 0.10 30), oklch(0.70 0.13 45))",
    },
    {
      bottom: "22%",
      right: "8%",
      rotate: -7,
      delay: 3,
      label: "Prom night",
      bg: "linear-gradient(135deg, oklch(0.80 0.12 320), oklch(0.65 0.16 350))",
    },
  ];

  return (
    <div className="absolute inset-0 pointer-events-none hidden md:block">
      {items.map((it, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, scale: 0.7, rotate: it.rotate }}
          animate={{
            opacity: 0.85,
            scale: 1,
            rotate: it.rotate,
          }}
          transition={{ duration: 1, delay: 0.5 + it.delay * 0.2 }}
          className="absolute polaroid w-32 lg:w-40"
          style={{
            top: it.top,
            left: it.left,
            right: (it as { right?: string }).right,
            bottom: (it as { bottom?: string }).bottom,
          }}
        >
          <div className="aspect-square w-full rounded-sm" style={{ background: it.bg }} />
          <div className="text-center text-[10px] text-muted-foreground mt-2 font-serif italic">
            {it.label}
          </div>
          <motion.div
            animate={{ y: [0, -8, 0], rotate: [it.rotate, it.rotate + 1.5, it.rotate] }}
            transition={{ duration: 6, repeat: Infinity, delay: it.delay }}
            className="absolute inset-0"
          />
        </motion.div>
      ))}
    </div>
  );
}
