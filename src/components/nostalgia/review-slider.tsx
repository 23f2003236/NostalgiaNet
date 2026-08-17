"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Quote, ChevronLeft, ChevronRight, Sparkles, Heart } from "lucide-react";
import { cn } from "@/lib/utils";

type Review = {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  user: { name: string; avatar: string | null };
};

export function ReviewSlider() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    let active = true;
    const run = async () => {
      try {
        const res = await fetch("/api/reviews");
        const data = await res.json();
        if (active) {
          setReviews(data.reviews || []);
          setLoading(false);
        }
      } catch {
        if (active) setLoading(false);
      }
    };
    run();
    return () => { active = false; };
  }, []);

  // Auto-advance every 5 seconds (pause on hover)
  useEffect(() => {
    if (paused || reviews.length <= 1) return;
    const t = setInterval(() => {
      setIndex((i) => (i + 1) % reviews.length);
    }, 5000);
    return () => clearInterval(t);
  }, [paused, reviews.length]);

  // Reset index when reviews change
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    setIndex(0);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [reviews]);

  if (loading) {
    return null; // Don't render anything while loading
  }

  if (reviews.length === 0) {
    return null; // No approved reviews yet — section hidden
  }

  const current = reviews[index];
  const next = () => setIndex((i) => (i + 1) % reviews.length);
  const prev = () => setIndex((i) => (i - 1 + reviews.length) % reviews.length);

  return (
    <section
      id="reviews"
      className="relative py-24 lg:py-32 bg-muted/40 overflow-hidden"
    >
      {/* Decorative background */}
      <div className="absolute -top-24 -left-24 size-64 rounded-full bg-gradient-to-br from-primary/10 to-accent/10 blur-3xl" />
      <div className="absolute -bottom-24 -right-24 size-64 rounded-full bg-gradient-to-br from-accent/10 to-primary/10 blur-3xl" />

      <div className="container mx-auto px-6 lg:px-12 relative z-10">
        <div className="max-w-2xl mx-auto text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-medium mb-4"
          >
            <Heart className="size-3 fill-accent" />
            <span>Loved by memory-keepers</span>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7, delay: 0.05 }}
            className="font-display text-4xl lg:text-5xl font-semibold tracking-tight"
          >
            What people are{" "}
            <span className="text-gradient-warm italic">saying</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="mt-5 text-muted-foreground font-serif text-lg"
          >
            Real reviews from real users. The latest {reviews.length} of our
            top-rated experiences.
          </motion.p>
        </div>

        {/* Slider */}
        <div
          className="max-w-3xl mx-auto relative"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <div className="relative min-h-[200px] flex items-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={current.id}
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }}
                transition={{ duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
                className="w-full"
              >
                <div className="bg-card border border-border/60 rounded-3xl p-8 lg:p-10 shadow-warm relative overflow-hidden">
                  <Quote className="absolute -top-4 -left-4 size-20 text-primary/5 rotate-180" />
                  <div className="relative">
                    {/* Stars */}
                    <div className="flex items-center gap-1 mb-4">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={cn(
                            "size-5",
                            i < current.rating
                              ? "fill-accent text-accent"
                              : "fill-transparent text-muted-foreground/30"
                          )}
                        />
                      ))}
                    </div>

                    {/* Comment */}
                    {current.comment ? (
                      <p className="font-serif text-base lg:text-lg leading-relaxed text-foreground/90 mb-6">
                        &ldquo;{current.comment}&rdquo;
                      </p>
                    ) : (
                      <p className="font-serif text-base lg:text-lg leading-relaxed text-muted-foreground mb-6 italic">
                        Rated {current.rating} out of 5 stars.
                      </p>
                    )}

                    {/* Author */}
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-full bg-gradient-to-br from-primary to-accent grid place-items-center text-primary-foreground font-semibold text-sm overflow-hidden">
                        {current.user.avatar ? (
                          <img
                            src={current.user.avatar}
                            alt={current.user.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          current.user.name?.[0]?.toUpperCase() || "?"
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-sm">
                          {current.user.name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(current.createdAt).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Nav arrows — only show if more than 1 review */}
          {reviews.length > 1 && (
            <>
              <button
                onClick={prev}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 lg:-translate-x-6 size-10 grid place-items-center rounded-full bg-card border border-border/60 shadow-warm hover:border-primary/40 hover:shadow-glow transition-all z-10"
                aria-label="Previous review"
              >
                <ChevronLeft className="size-5" />
              </button>
              <button
                onClick={next}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 lg:translate-x-6 size-10 grid place-items-center rounded-full bg-card border border-border/60 shadow-warm hover:border-primary/40 hover:shadow-glow transition-all z-10"
                aria-label="Next review"
              >
                <ChevronRight className="size-5" />
              </button>
            </>
          )}

          {/* Dots */}
          {reviews.length > 1 && (
            <div className="flex items-center justify-center gap-1.5 mt-6">
              {reviews.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setIndex(i)}
                  className={cn(
                    "rounded-full transition-all",
                    i === index
                      ? "w-6 h-2 bg-primary"
                      : "w-2 h-2 bg-muted-foreground/30 hover:bg-muted-foreground/50"
                  )}
                  aria-label={`Go to review ${i + 1}`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Counter */}
        <div className="text-center mt-4 text-xs text-muted-foreground">
          Showing {index + 1} of {reviews.length} reviews
        </div>
      </div>
    </section>
  );
}
