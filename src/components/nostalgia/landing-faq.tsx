"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { ChevronDown, HelpCircle, Code2, Bug, Rocket, Sparkles } from "lucide-react";

const FAQS = [
  {
    q: "What is NostalgiaNet++?",
    a: "NostalgiaNet++ is a digital time capsule platform — a beautiful place to seal your cherished photos, videos, and stories inside locked vaults, set a future unlock date, and reopen them when the moment arrives. Think of it as a letter to your future self, but with photos, videos, and friends.",
  },
  {
    q: "Who made this website?",
    a: "This website was built by Rohan Kumar, who is currently pursuing the IITM BS Degree (Diploma term). The development process used a powerful AI-assisted workflow — zcode (an AI coding agent) wrote the code blocks, GLM (the AI model) handled the overall architecture and publishing for demo purposes, and Claude (another AI) was used for debugging and reviewing errors. We plan to make this a real-world app once all features are complete.",
  },
  {
    q: "What is the owner's background?",
    a: "Rohan Kumar is a student currently enrolled in the IITM BS Degree program, in the Diploma term. He's passionate about building products that help people preserve what matters most — their memories. NostalgiaNet++ is his vision of a warmer, more intentional alternative to fast-paced social media — a place where time itself is the feature, not the enemy.",
  },
  {
    q: "How does it work?",
    a: "Three simple steps: First, you upload photos, videos, or notes into a TimeVault and give it a title. Second, you pick an unlock date — tomorrow, next month, your wedding day, your kid's 18th birthday, any future date. Third, you wait. On the unlock date, your vault opens and the future-you gets a gift from the past-you. Pure joy.",
  },
  {
    q: "What features do you have?",
    a: "Right now: TimeVaults (sealed capsules with countdown timers), photo Albums (open collections), Journal entries (with mood, weather, and tags), Friends (invite by email, share capsules), a public Discover feed, collaborative vaults (invite friends to contribute), referral rewards (invite a friend, your vault unlocks 3 days earlier), 7 beautiful themes, and an admin panel for the owner. We're adding more features in the future — this is just the beginning.",
  },
  {
    q: "Is it free?",
    a: "Yes! NostalgiaNet++ is completely free during the construction phase (until January 2027). You can sign up, create vaults, upload up to 3 photos per day, write journals, and invite friends — all for ₹0. A single $12/month Premium plan is coming in January 2027 — details will be announced closer to launch.",
  },
  {
    q: "Can I share my vaults with friends?",
    a: "Absolutely. You can share any vault two ways: (1) Make it public and share the link — anyone can see the countdown (sealed) or the memories (unlocked) without signing up. (2) Use the collaborative invite link — your friends sign up and can add their own photos to the vault before it seals. Great for group trips, family events, or 'open in 5 years together' moments.",
  },
  {
    q: "Are my photos safe?",
    a: "Your memories are yours. We never sell your data, never train AI on your photos, and public capsules are strictly opt-in (private by default). Passwords are hashed with bcrypt (industry-standard), all API routes are auth-gated with ownership checks, and we use Vercel Blob for persistent, secure file storage in production.",
  },
  {
    q: "What happens when a vault unlocks?",
    a: "On the unlock date, your vault opens automatically. You'll see a notification in the app (the bell icon in the topbar), and if you've configured email notifications, you'll receive a beautiful HTML email saying 'Today is the day.' The memories inside — photos, videos, notes — become viewable. It's like Christmas morning, but from your past self.",
  },
  {
    q: "Can I change my password or theme?",
    a: "Yes to both. Go to Settings (gear icon in the sidebar) — you can change your display name, bio, and profile picture, update your password, and pick from 7 gorgeous themes (Warm Sepia, Ocean Blue, Forest Green, Rose Pink, Midnight Purple, Sunset Orange, and Mono Slate). Theme changes apply instantly across the entire app.",
  },
];

export function LandingFaq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="relative py-24 lg:py-32">
      <div className="container mx-auto px-6 lg:px-12">
        <div className="max-w-2xl mx-auto text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-medium mb-4"
          >
            <HelpCircle className="size-3" />
            <span>Questions, answered</span>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7, delay: 0.05 }}
            className="font-display text-4xl lg:text-5xl font-semibold tracking-tight"
          >
            Frequently asked{" "}
            <span className="text-gradient-warm italic">questions</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="mt-5 text-muted-foreground font-serif text-lg"
          >
            Everything you want to know about NostalgiaNet++ — who built it,
            how it works, and what&apos;s coming next.
          </motion.p>
        </div>

        <div className="max-w-3xl mx-auto space-y-3">
          {FAQS.map((faq, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.4, delay: i * 0.04 }}
              className="rounded-2xl bg-card border border-border/60 overflow-hidden hover:border-primary/30 transition-colors"
            >
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between gap-4 p-5 text-left"
              >
                <span className="font-display text-base lg:text-lg font-semibold pr-4">
                  {faq.q}
                </span>
                <div className={`size-8 rounded-full grid place-items-center shrink-0 transition-all ${
                  open === i ? "bg-primary text-primary-foreground rotate-180" : "bg-muted text-muted-foreground"
                }`}>
                  <ChevronDown className="size-4" />
                </div>
              </button>
              <AnimatePresence initial={false}>
                {open === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: [0.2, 0.8, 0.2, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 pb-5 pt-1 text-sm lg:text-base text-muted-foreground font-serif leading-relaxed">
                      {faq.a}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>

        {/* Credits strip */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="max-w-3xl mx-auto mt-12 p-6 rounded-3xl bg-gradient-to-br from-primary/5 via-accent/5 to-primary/5 border border-border/60"
        >
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Code2 className="size-4 text-accent" />
              <span>Built with <span className="font-medium text-foreground">zcode</span></span>
            </div>
            <div className="hidden sm:block w-px h-4 bg-border" />
            <div className="flex items-center gap-2 text-muted-foreground">
              <Rocket className="size-4 text-accent" />
              <span>Published by <span className="font-medium text-foreground">GLM</span></span>
            </div>
            <div className="hidden sm:block w-px h-4 bg-border" />
            <div className="flex items-center gap-2 text-muted-foreground">
              <Bug className="size-4 text-accent" />
              <span>Reviewed by <span className="font-medium text-foreground">Claude</span></span>
            </div>
          </div>
          <div className="mt-4 text-center text-xs text-muted-foreground font-serif italic">
            A project by Rohan Kumar · IITM BS Degree (Diploma term)
          </div>
        </motion.div>
      </div>
    </section>
  );
}
