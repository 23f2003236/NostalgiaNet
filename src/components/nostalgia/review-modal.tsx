"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, X, Loader2, Send, Heart } from "lucide-react";
import { toast } from "sonner";
import { Logo } from "@/components/icons/logo";
import { cn } from "@/lib/utils";

export function ReviewModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error("Please pick a star rating", { duration: 6000 });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, comment: comment.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not submit review");
      toast.success(
        "Thank you for your review! It'll appear on the landing page once the admin approves it.",
        { duration: 6000 }
      );
      setRating(0);
      setHover(0);
      setComment("");
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not submit review", {
        duration: 6000,
      });
    } finally {
      setSaving(false);
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
            onClick={() => !saving && onClose()}
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
              onClick={() => !saving && onClose()}
              className="absolute top-4 right-4 size-8 grid place-items-center rounded-full hover:bg-muted transition-colors z-10 disabled:opacity-50"
              aria-label="Close"
              disabled={saving}
            >
              <X className="size-4" />
            </button>

            <div className="p-7 pt-9">
              <div className="flex items-center gap-2.5 mb-6">
                <Logo className="size-9" />
                <div>
                  <div className="font-display text-lg font-semibold leading-none">
                    Nostalgia<span className="text-accent">Net</span>++
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-1">
                    Rate your experience
                  </div>
                </div>
              </div>

              <h2 className="font-display text-2xl font-semibold mb-1">
                How was NostalgiaNet++?
              </h2>
              <p className="text-sm text-muted-foreground mb-6">
                Your rating helps others discover the app. Comment is optional.
              </p>

              {/* Star rating */}
              <div className="flex items-center justify-center gap-2 mb-6">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHover(star)}
                    onMouseLeave={() => setHover(0)}
                    className="transition-all hover:scale-110"
                    aria-label={`${star} star${star > 1 ? "s" : ""}`}
                  >
                    <Star
                      className={cn(
                        "size-10 transition-colors",
                        (hover || rating) >= star
                          ? "fill-accent text-accent"
                          : "fill-transparent text-muted-foreground/30"
                      )}
                    />
                  </button>
                ))}
              </div>

              {/* Rating label */}
              <div className="text-center text-sm text-muted-foreground mb-5 h-5">
                {rating === 1 && "😔 Needs work"}
                {rating === 2 && "😐 Could be better"}
                {rating === 3 && "🙂 It's okay"}
                {rating === 4 && "😊 Really good!"}
                {rating === 5 && "🤩 Absolutely love it!"}
              </div>

              {/* Optional comment */}
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                  Comment (optional) — how does it feel to use this app?
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Tell us what you think…"
                  rows={3}
                  maxLength={500}
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-background/60 focus:bg-background focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/15 text-sm transition-all resize-none font-serif"
                />
                <div className="text-right text-[10px] text-muted-foreground mt-0.5">
                  {comment.length}/500
                </div>
              </div>

              {/* Submit */}
              <button
                onClick={handleSubmit}
                disabled={saving || rating === 0}
                className="w-full mt-4 inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-primary-foreground font-medium shadow-warm hover:shadow-glow transition-all hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-wait disabled:translate-y-0"
              >
                {saving ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <>
                    <Heart className="size-4" />
                    <span>Submit review</span>
                    <Send className="size-3.5" />
                  </>
                )}
              </button>

              <p className="mt-4 text-center text-[10px] text-muted-foreground">
                Reviews with 4+ stars appear on the landing page after admin approval.
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
