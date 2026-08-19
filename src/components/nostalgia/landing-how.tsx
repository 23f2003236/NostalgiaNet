"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Upload, CalendarHeart, Gift } from "lucide-react";

const STEPS = [
  {
    icon: Upload,
    title: "Capture & upload",
    desc: "Drag-drop photos, videos, and notes into a fresh capsule. Add a cover, a title, a heartfelt description.",
  },
  {
    icon: CalendarHeart,
    title: "Pick the unlock day",
    desc: "Tomorrow, next month, your wedding day, your kid's 18th birthday. Any future date — sealed until then.",
  },
  {
    icon: Gift,
    title: "Open when it arrives",
    desc: "On the unlock date, your capsule opens. The future-you gets a gift from the past-you. Pure joy.",
  },
];

export function LandingHow() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section id="how" className="relative py-24 lg:py-32 bg-muted/40">
      <div className="container mx-auto px-6 lg:px-12">
        <div className="max-w-2xl mx-auto text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: shouldReduceMotion ? 0.15 : 0.6 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-4"
          >
            <span>Three quiet steps</span>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: shouldReduceMotion ? 0.15 : 0.7, delay: shouldReduceMotion ? 0 : 0.05 }}
            className="font-display text-4xl lg:text-5xl font-semibold tracking-tight"
          >
            How a capsule is{" "}
            <span className="text-gradient-warm italic">made</span>
          </motion.h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto relative">
          {/* Connecting dashed line */}
          <div className="hidden md:block absolute top-12 left-[16.66%] right-[16.66%] h-px border-t-2 border-dashed border-accent/30" />

          {STEPS.map((s, i) => (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: shouldReduceMotion ? 0 : i * 0.12 }}
              className="relative bg-card border border-border/60 rounded-3xl p-7 text-center"
            >
              <div className="relative size-24 mx-auto mb-5">
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/15 to-accent/15 blur-md" />
                <div className="relative size-24 rounded-full bg-card border-2 border-accent/40 grid place-items-center">
                  <s.icon className="size-9 text-accent" />
                </div>
                <div className="absolute -top-1 -right-1 size-7 rounded-full bg-primary text-primary-foreground text-xs font-semibold grid place-items-center shadow">
                  {i + 1}
                </div>
              </div>
              <h3 className="font-display text-xl font-semibold mb-2">
                {s.title}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {s.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
