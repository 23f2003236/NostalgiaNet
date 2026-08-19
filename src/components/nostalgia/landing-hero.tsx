"use client";

import { useState, useEffect, useRef } from "react";
import { motion, useReducedMotion, useInView } from "framer-motion";
import { Clock, Sparkles, ArrowRight } from "lucide-react";
import { Logo } from "@/components/icons/logo";

// ── Count-up stat ────────────────────────────────────────────────────────────
function Stat({ value, label }: { value: string; label: string }) {
  const isSymbol = value === "∞";
  const target = isSymbol ? 0 : parseInt(value, 10);
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  // `once: true` so the counter fires only the first time it enters view
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    if (isSymbol || !inView) return;

    if (shouldReduceMotion) {
      // Respect OS setting — jump straight to final value inside rAF
      // to keep all setState calls out of the synchronous effect body.
      requestAnimationFrame(() => setCount(target));
      return;
    }

    const duration = 1300; // ms
    const startTime = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setCount(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [inView, isSymbol, target, shouldReduceMotion]);

  return (
    <div ref={ref} className="text-center pt-6">
      {isSymbol ? (
        <motion.div
          initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.5 }}
          animate={inView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
          className="font-display text-2xl font-semibold text-gradient-warm"
        >
          ∞
        </motion.div>
      ) : (
        <div className="font-display text-2xl font-semibold text-gradient-warm">
          {count}
        </div>
      )}
      <div className="text-xs text-muted-foreground mt-1">{label}</div>
    </div>
  );
}

// ── Floating polaroid images ─────────────────────────────────────────────────
function FloatingPolaroids() {
  const shouldReduceMotion = useReducedMotion();

  const items = [
    {
      top: "10%",
      left: "5%",
      rotate: -7,
      delay: 0,
      label: "Summer night",
      src: "/images/altinay-dinc-LluELtL5mK4-unsplash.jpg",
    },
    {
      top: "18%",
      right: "6%",
      rotate: 6,
      delay: 1,
      label: "First snow drive",
      src: "/images/bradley-dunn-qijkjkJm63c-unsplash.jpg",
    },
    {
      bottom: "16%",
      left: "8%",
      rotate: 5,
      delay: 2,
      label: "Last winter trip",
      src: "/images/ran-liwen-rzYNrA9XK0c-unsplash.jpg",
    },
    {
      bottom: "20%",
      right: "5%",
      rotate: -6,
      delay: 3,
      label: "Beach day '21",
      src: "/images/vitolda-klein-Nru3PmN8TjI-unsplash.jpg",
    },
  ];

  return (
    <div className="absolute inset-0 pointer-events-none hidden md:block">
      {items.map((it, i) => (
        <motion.div
          key={i}
          // Staggered entrance — each polaroid fades + scales in separately
          initial={
            shouldReduceMotion
              ? { opacity: 0 }
              : { opacity: 0, scale: 0.75, rotate: it.rotate }
          }
          animate={{ opacity: 1, scale: 1, rotate: it.rotate }}
          transition={{
            duration: shouldReduceMotion ? 0.3 : 0.9,
            delay: shouldReduceMotion ? 0 : 0.4 + it.delay * 0.18,
          }}
          className="absolute polaroid"
          style={{
            width: "clamp(120px, 11vw, 164px)",
            top: it.top,
            left: (it as { left?: string }).left,
            right: (it as { right?: string }).right,
            bottom: (it as { bottom?: string }).bottom,
          }}
        >
          {/* Inner wrapper — gentle continuous float (disabled for reduced motion) */}
          <motion.div
            animate={
              shouldReduceMotion
                ? {}
                : {
                    y: [0, -7, 0],
                    rotate: [it.rotate, it.rotate + 1.5, it.rotate],
                  }
            }
            transition={{
              duration: 6,
              repeat: Infinity,
              // Different phase per image so they don't sync up
              delay: it.delay * 0.5,
              ease: "easeInOut",
            }}
            className="w-full"
          >
            <div className="w-full aspect-[4/3] rounded-sm overflow-hidden">
              <img
                src={it.src}
                alt={it.label}
                className="w-full h-full object-cover"
                draggable={false}
              />
            </div>
            <div className="text-center text-[10px] text-muted-foreground mt-2 font-serif italic leading-tight px-1">
              {it.label}
            </div>
          </motion.div>
        </motion.div>
      ))}
    </div>
  );
}

// ── Hero ─────────────────────────────────────────────────────────────────────
export function LandingHero({ onGetStarted }: { onGetStarted: () => void }) {
  const shouldReduceMotion = useReducedMotion();

  // Shared helpers so we don't repeat the shouldReduceMotion guard everywhere
  const fadeUp = (delay = 0) => ({
    initial: { opacity: 0, y: shouldReduceMotion ? 0 : 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: shouldReduceMotion ? 0.15 : 0.7, delay: shouldReduceMotion ? 0 : delay },
  });

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Soft gradient backdrop */}
      <div className="absolute inset-0 -z-10 bg-paper" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-transparent via-transparent to-background" />

      {/* Floating decorative polaroids */}
      <FloatingPolaroids />

      <div className="container mx-auto px-6 lg:px-12 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: shouldReduceMotion ? 0.15 : 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 mb-6 rounded-full glass border border-border/60 text-xs font-medium text-muted-foreground"
          >
            <Sparkles className="size-3.5 text-accent" />
            <span>A digital time capsule for the moments that matter</span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            {...fadeUp(0.05)}
            className="font-display text-5xl sm:text-6xl lg:text-7xl font-semibold tracking-tight leading-[1.05]"
          >
            <span className="block text-foreground">For you,</span>
            <span className="block text-gradient-warm italic">years from now.</span>
          </motion.h1>

          {/* Sub-headline */}
          <motion.p
            {...fadeUp(0.15)}
            className="mt-7 mx-auto max-w-2xl text-lg lg:text-xl text-muted-foreground font-serif leading-relaxed"
          >
            Seal your cherished photos, videos, and stories inside beautiful time
            capsules. Set an unlock date. Years later, the future-you will thank
            the present-you.
          </motion.p>

          {/* CTAs */}
          <motion.div
            {...fadeUp(0.25)}
            className="mt-10 flex flex-wrap items-center justify-center gap-4"
          >
            <button
              onClick={onGetStarted}
              className="group relative inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-primary text-primary-foreground font-medium shadow-warm hover:shadow-glow transition-all duration-300 hover:-translate-y-0.5 hover:scale-[1.02]"
            >
              <span>Start your first capsule</span>
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </button>
            <a
              href="#how"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full glass border border-border/60 text-foreground hover:border-primary/40 hover:scale-[1.02] transition-all duration-200"
            >
              <Clock className="size-4 text-accent" />
              <span>See how it works</span>
            </a>
          </motion.div>

          {/* Stats / trust strip — numbers count up when they enter view */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: shouldReduceMotion ? 0 : 0.5 }}
            className="mt-16 mb-12 grid grid-cols-3 gap-4 max-w-2xl mx-auto pt-8 vintage-divider"
          >
            <Stat label="Memories sealed" value="143" />
            <Stat label="Capsules unlocked" value="31" />
            <Stat label="Years of joy" value="∞" />
          </motion.div>
        </div>
      </div>

      {/* Bottom tagline */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 text-xs text-muted-foreground">
        <Logo className="size-4" />
        <span className="font-serif italic">NostalgiaNet++ — where memories live forever</span>
      </div>
    </section>
  );
}
