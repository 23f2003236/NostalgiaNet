"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, X, Send, Sparkles } from "lucide-react";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";

type Message = {
  role: "bot" | "user";
  text: string;
};

// Pre-programmed responses based on keyword matching.
// This is intentionally a simple keyword bot — the owner is working on making
// it a fully functional AI assistant in the future.
const RESPONSES: { keywords: string[]; reply: string }[] = [
  {
    keywords: ["hi", "hello", "hey", "start"],
    reply: "Hi! I'm the NostalgiaNet++ helper bot. I can answer basic questions about the app. What would you like to know? (Try: 'how to create a vault', 'themes', 'upload limit', 'who made this')",
  },
  {
    keywords: ["vault", "create", "capsule", "new", "make"],
    reply: "To create a TimeVault: go to the TimeVaults tab in the sidebar → click 'New capsule' → add a title, description, and photos → pick an unlock date → click 'Seal capsule'. Your memories will be locked until that date!",
  },
  {
    keywords: ["theme", "color", "appearance", "dark", "light"],
    reply: "You can pick from 7 beautiful themes! Go to Settings → Theme section. Choose from Warm Sepia, Ocean Blue, Forest Green, Rose Pink, Midnight Purple, Sunset Orange, or Mono Slate. Changes apply instantly across the entire app.",
  },
  {
    keywords: ["upload", "limit", "photo", "3", "day"],
    reply: "During the construction phase (until January 2027), you can upload up to 3 photos per day. This limit will be lifted once paid plans launch. Admin accounts bypass this limit.",
  },
  {
    keywords: ["password", "change", "reset"],
    reply: "You can change your password in Settings → 'Change password' section. You'll need your current password and a new one (at least 6 characters).",
  },
  {
    keywords: ["who", "made", "built", "owner", "rohan", "creator"],
    reply: "NostalgiaNet++ was built by Rohan Kumar, who is currently pursuing the IITM BS Degree (Diploma term). The code was written using zcode (an AI coding agent), published by GLM for demo purposes, and reviewed by Claude for bugs.",
  },
  {
    keywords: ["google", "sign in", "login", "signup", "auth"],
    reply: "Google sign-in is coming soon! For now, please sign up manually with your email and a password — it takes less than a minute. You can also try 'Explore as demo' for a quick look around.",
  },
  {
    keywords: ["friend", "invite", "share", "collaborate"],
    reply: "To invite friends: open any vault → click 'Invite friends to add memories' → copy the invite link → share it. Your friends will need to sign up to add their photos before the vault seals.",
  },
  {
    keywords: ["admin", "owner", "delete", "moderate"],
    reply: "The app owner (admin) has full control through the Admin Panel — they can see all users, vaults, and memories, and can delete anything. Only the owner has this access.",
  },
  {
    keywords: ["feature", "future", "coming", "plan", "roadmap"],
    reply: "We're adding multiple features in the future — including AI-powered memory descriptions, mobile apps, video uploads, year-in-review recaps, and more. This is just the beginning!",
  },
  {
    keywords: ["free", "price", "cost", "paid", "plan"],
    reply: "NostalgiaNet++ is completely free during construction (until January 2027). Paid plans (Keeper $3/mo, Family $6/mo) will launch then with unlimited uploads, video storage, and more.",
  },
  {
    keywords: ["unlock", "open", "when", "date"],
    reply: "Your vault unlocks automatically on the date you set. You'll get an in-app notification (the bell icon), and if email notifications are configured, you'll receive a beautiful email saying 'Today is the day.'",
  },
  {
    keywords: ["bot", "help", "what can you do"],
    reply: "I'm a simple helper bot — I can answer basic questions about NostalgiaNet++. The owner is working hard to make me fully functional with real AI soon! For now, try asking about: vaults, themes, uploads, friends, or who built this app.",
  },
  {
    keywords: ["thank", "thanks", "awesome", "great", "cool", "nice"],
    reply: "Thank you! I'm glad I could help. Remember — the owner is working hard to make this bot fully workable soon. Have a great day sealing memories! 🌟",
  },
];

const DEFAULT_REPLY = "I'm not sure how to answer that yet — the owner is working hard to make this bot fully workable! For now, try asking about: vaults, themes, uploads, friends, password, or who built this app.";

function getReply(userText: string): string {
  const lower = userText.toLowerCase();
  // Use word-boundary matching to avoid false positives like "this" containing "hi"
  for (const r of RESPONSES) {
    if (r.keywords.some((kw) => {
      // Match whole words only — \b ensures "hi" doesn't match inside "this"
      const regex = new RegExp(`\\b${kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
      return regex.test(lower);
    })) {
      return r.reply;
    }
  }
  return DEFAULT_REPLY;
}

export function HelpBot() {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [hasGreeted, setHasGreeted] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll to bottom — must be before any conditional return
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, typing]);

  // Only show the bot when user is logged in
  if (!session?.user) return null;

  const toggleOpen = () => {
    setOpen((v) => !v);
    if (!hasGreeted) {
      setHasGreeted(true);
      setTimeout(() => {
        setMessages([
          {
            role: "bot",
            text: `Hi ${session.user?.name?.split(" ")[0] || "there"}! 👋 I'm the NostalgiaNet++ helper bot. The owner is working hard to make me fully functional soon. For now, I can answer basic questions — try asking about vaults, themes, uploads, or who built this app!`,
          },
        ]);
      }, 400);
    }
  };

  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg: Message = { role: "user", text: input.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setTyping(true);

    // Simulate typing delay
    setTimeout(() => {
      const reply = getReply(userMsg.text);
      setMessages((prev) => [...prev, { role: "bot", text: reply }]);
      setTyping(false);
    }, 800 + Math.random() * 600);
  };

  return (
    <>
      {/* Floating button */}
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 1, type: "spring", stiffness: 200 }}
        onClick={toggleOpen}
        className="fixed bottom-6 right-6 z-50 size-14 rounded-full bg-primary text-primary-foreground shadow-warm hover:shadow-glow transition-all hover:scale-105 grid place-items-center"
        aria-label="Help bot"
      >
        <AnimatePresence mode="wait">
          {open ? (
            <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
              <X className="size-6" />
            </motion.div>
          ) : (
            <motion.div key="bot" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}>
              <Bot className="size-6" />
            </motion.div>
          )}
        </AnimatePresence>
        {!open && (
          <span className="absolute -top-1 -right-1 size-4 rounded-full bg-accent animate-pulse" />
        )}
      </motion.button>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.25, ease: [0.2, 0.8, 0.2, 1] }}
            className="fixed bottom-24 right-6 z-50 w-80 max-w-[calc(100vw-3rem)] h-96 max-h-[calc(100vh-8rem)] bg-card border border-border/60 rounded-3xl shadow-warm overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center gap-2.5 p-4 border-b border-border/60 bg-gradient-to-r from-primary/5 to-accent/5">
              <div className="size-8 rounded-full bg-gradient-to-br from-primary to-accent grid place-items-center text-primary-foreground">
                <Bot className="size-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold flex items-center gap-1.5">
                  Helper Bot
                  <span className="size-2 rounded-full bg-emerald-500" />
                </div>
                <div className="text-[10px] text-muted-foreground">
                  Online · replies instantly
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="size-7 grid place-items-center rounded-full hover:bg-muted"
                aria-label="Close"
              >
                <X className="size-3.5" />
              </button>
            </div>

            {/* Messages */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-4 space-y-3"
            >
              {messages.map((m, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "flex",
                    m.role === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[80%] px-3 py-2 rounded-2xl text-xs leading-relaxed",
                      m.role === "user"
                        ? "bg-primary text-primary-foreground rounded-br-sm"
                        : "bg-muted text-foreground rounded-bl-sm"
                    )}
                  >
                    {m.text}
                  </div>
                </motion.div>
              ))}

              {typing && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-start"
                >
                  <div className="bg-muted px-4 py-3 rounded-2xl rounded-bl-sm flex items-center gap-1">
                    <div className="size-1.5 rounded-full bg-muted-foreground/60 animate-pulse" />
                    <div className="size-1.5 rounded-full bg-muted-foreground/60 animate-pulse" style={{ animationDelay: "150ms" }} />
                    <div className="size-1.5 rounded-full bg-muted-foreground/60 animate-pulse" style={{ animationDelay: "300ms" }} />
                  </div>
                </motion.div>
              )}

              {messages.length === 1 && !typing && (
                <div className="pt-2">
                  <div className="text-[10px] text-muted-foreground mb-2 flex items-center gap-1">
                    <Sparkles className="size-2.5 text-accent" />
                    Suggested questions:
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {["How to create a vault?", "What themes?", "Who made this?", "Upload limit?"].map((q) => (
                      <button
                        key={q}
                        onClick={() => {
                          setInput(q);
                          setTimeout(() => {
                            const userMsg: Message = { role: "user", text: q };
                            setMessages((prev) => [...prev, userMsg]);
                            setInput("");
                            setTyping(true);
                            setTimeout(() => {
                              setMessages((prev) => [...prev, { role: "bot", text: getReply(q) }]);
                              setTyping(false);
                            }, 800);
                          }, 100);
                        }}
                        className="px-2.5 py-1 rounded-full bg-muted/60 hover:bg-primary/10 hover:text-primary text-[10px] transition-colors border border-border/40"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-3 border-t border-border/60">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder="Ask me anything..."
                  className="flex-1 px-3 py-2 rounded-full bg-muted/60 border border-transparent focus:bg-background focus:border-primary/30 focus:outline-none text-xs transition-all"
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim()}
                  className="size-8 grid place-items-center rounded-full bg-primary text-primary-foreground disabled:opacity-40 hover:shadow-glow transition-all shrink-0"
                  aria-label="Send"
                >
                  <Send className="size-3.5" />
                </button>
              </div>
              <div className="text-[9px] text-muted-foreground mt-1.5 text-center">
                The owner is working hard to make this bot fully functional 🚀
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
