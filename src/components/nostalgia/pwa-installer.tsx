"use client";

import { useEffect } from "react";

// Registers the service worker for PWA installability.
// This is a client component rendered from the root layout so SW registration
// happens on every page without blocking rendering.
export function PWAInstaller() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .catch(() => {
          // Registration can fail in browsers that block SW (e.g. private mode
          // in some Safari versions). The app works fine without it — just
          // won't be installable in those contexts.
        });
    }
  }, []);

  // Renders nothing — purely for side effects
  return null;
}