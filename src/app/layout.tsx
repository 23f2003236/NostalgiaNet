import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display, Lora } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { AppStoreProvider } from "@/components/providers/app-store";
import { PWAInstaller } from "@/components/nostalgia/pwa-installer";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

const lora = Lora({
  subsets: ["latin"],
  variable: "--font-lora",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#8b4513",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "NostalgiaNet++ — Where Memories Live Forever",
  description:
    "Preserve your cherished moments in time capsules. Lock memories away, set an unlock date, and relive them years from now. A beautiful digital memory vault.",
  keywords: ["time capsule", "memories", "nostalgia", "memory vault", "journal"],
  // PWA + iOS home screen
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "NostalgiaNet",
  },
  icons: {
    apple: "/api/icons/180",
    icon: [
      { url: "/api/icons/32", sizes: "32x32", type: "image/png" },
      { url: "/api/icons/192", sizes: "192x192", type: "image/png" },
    ],
  },
};

// Inline script — runs before hydration to apply the saved theme + color scheme.
// Prevents the "flash of wrong theme" that would otherwise happen if we
// applied data-theme in a useEffect.
const themeInitScript = `
(function() {
  try {
    var theme = localStorage.getItem('nostalgianet-theme') || 'slate';
    var mode = localStorage.getItem('nostalgianet-color-mode') || 'light';
    var root = document.documentElement;
    root.setAttribute('data-theme', theme);
    if (mode === 'dark') root.classList.add('dark');
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body
        className={`${inter.variable} ${playfair.variable} ${lora.variable} font-sans antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <AppStoreProvider>
            {children}
            <Toaster
              position="bottom-right"
              toastOptions={{
                duration: 6000, // 6-second toasts (item #5)
                classNames: {
                  toast: "font-sans",
                },
              }}
            />
          </AppStoreProvider>
        </ThemeProvider>
        {/* Registers /sw.js for PWA installability — renders nothing */}
        <PWAInstaller />
      </body>
    </html>
  );
}
