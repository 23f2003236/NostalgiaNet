"use client";

import { motion } from "framer-motion";
import { Github, Twitter, Instagram, Mail } from "lucide-react";
import { toast } from "sonner";
import { Logo } from "@/components/icons/logo";

export function LandingFooter() {
  const handleSocialClick = (label: string) => {
    toast.info(
      `${label} links are coming soon! The owner will add these later. Follow NostalgiaNet++ for updates.`,
      { duration: 6000 }
    );
  };

  return (
    <footer className="relative border-t border-border/60 pt-16 pb-10 mt-10">
      <div className="container mx-auto px-6 lg:px-12">
        <div className="grid md:grid-cols-4 gap-10 max-w-6xl mx-auto">
          <div className="md:col-span-2">
            <a href="#" className="flex items-center gap-2.5 mb-4">
              <Logo className="size-9" />
              <span className="font-display text-lg font-semibold">
                Nostalgia<span className="text-accent">Net</span>++
              </span>
            </a>
            <p className="text-muted-foreground font-serif text-sm max-w-sm leading-relaxed">
              A quiet place to seal the moments that matter, and reopen them when
              the future arrives. Built with care for memory-keepers everywhere.
            </p>
            <div className="flex items-center gap-2 mt-6">
              {[
                { icon: Twitter, label: "Twitter" },
                { icon: Instagram, label: "Instagram" },
                { icon: Github, label: "GitHub" },
                { icon: Mail, label: "Email" },
              ].map((s) => (
                <button
                  key={s.label}
                  onClick={() => handleSocialClick(s.label)}
                  aria-label={s.label}
                  className="size-9 grid place-items-center rounded-full border border-border/60 hover:border-primary/40 hover:bg-muted/60 transition-colors"
                >
                  <s.icon className="size-4 text-muted-foreground" />
                </button>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-display text-sm font-semibold mb-4">Product</h4>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              <li><a href="#features" className="hover:text-foreground transition-colors">Features</a></li>
              <li><a href="#how" className="hover:text-foreground transition-colors">How it works</a></li>
              <li><a href="#faq" className="hover:text-foreground transition-colors">FAQ</a></li>
              <li><a href="#testimonials" className="hover:text-foreground transition-colors">Stories</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-display text-sm font-semibold mb-4">Company</h4>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              <li><a href="#faq" className="hover:text-foreground transition-colors">About</a></li>
              <li>
                <button onClick={() => handleSocialClick("Privacy policy")} className="hover:text-foreground transition-colors text-left">
                  Privacy
                </button>
              </li>
              <li>
                <button onClick={() => handleSocialClick("Terms of service")} className="hover:text-foreground transition-colors text-left">
                  Terms
                </button>
              </li>
              <li>
                <button onClick={() => handleSocialClick("Contact")} className="hover:text-foreground transition-colors text-left">
                  Contact
                </button>
              </li>
            </ul>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mt-12 pt-8 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground"
        >
          <p>© {new Date().getFullYear()} NostalgiaNet++. Memories live forever.</p>
          <p className="font-serif italic">Made with patience and a long view by Rohan Kumar.</p>
        </motion.div>
      </div>
    </footer>
  );
}
