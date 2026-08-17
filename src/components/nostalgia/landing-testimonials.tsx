"use client";

import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";

const STORIES = [
  {
    quote:
      "I sealed a letter to my daughter on her third birthday, set to open when she turns eighteen. Fifteen years from now, she'll read who I was the day she was three.",
    name: "Maya R.",
    role: "Mother of one",
    rating: 5,
    color: "from-rose-500/15 to-amber-500/10",
  },
  {
    quote:
      "My best friend and I made a shared capsule the night before he moved abroad. We opened it together three years later — tears, laughter, and a video of us at 22 we'd forgotten existed.",
    name: "Daniel K.",
    role: "Architect, Berlin",
    rating: 5,
    color: "from-amber-500/15 to-orange-500/10",
  },
  {
    quote:
      "Every New Year I write a letter to my future self, sealed for exactly one year. NostalgiaNet++ turned that little ritual into something beautiful — and the calendar reminds me to open each one.",
    name: "Priya S.",
    role: "Teacher, Mumbai",
    rating: 5,
    color: "from-orange-500/15 to-rose-500/10",
  },
];

export function LandingTestimonials() {
  return (
    <section id="testimonials" className="relative py-24 lg:py-32">
      <div className="container mx-auto px-6 lg:px-12">
        <div className="max-w-2xl mx-auto text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-medium mb-4"
          >
            <Star className="size-3" />
            <span>Stories from memory-keepers</span>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7, delay: 0.05 }}
            className="font-display text-4xl lg:text-5xl font-semibold tracking-tight"
          >
            Future-you will{" "}
            <span className="text-gradient-warm italic">thank you</span>
          </motion.h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {STORIES.map((s, i) => (
            <motion.div
              key={s.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.55, delay: i * 0.08 }}
              className="relative p-7 rounded-3xl bg-card border border-border/60 overflow-hidden"
            >
              <div
                className={`absolute -top-12 -right-12 size-32 rounded-full bg-gradient-to-br ${s.color} blur-2xl opacity-60`}
              />
              <Quote className="size-7 text-accent mb-4" />
              <p className="font-serif text-base leading-relaxed text-foreground/90 mb-6 relative">
                {s.quote}
              </p>
              <div className="flex items-center gap-1 mb-4">
                {Array.from({ length: s.rating }).map((_, j) => (
                  <Star
                    key={j}
                    className="size-3.5 fill-accent text-accent"
                  />
                ))}
              </div>
              <div className="flex items-center gap-3 pt-4 border-t border-border/60">
                <div className="size-10 rounded-full bg-gradient-to-br from-primary to-accent grid place-items-center text-primary-foreground font-semibold">
                  {s.name[0]}
                </div>
                <div>
                  <div className="font-medium text-sm">{s.name}</div>
                  <div className="text-xs text-muted-foreground">{s.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
