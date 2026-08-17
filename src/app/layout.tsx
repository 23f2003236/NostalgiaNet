import type { Metadata } from "next";
import { Inter, Playfair_Display, Lora } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { AppStoreProvider } from "@/components/providers/app-store";

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

export const metadata: Metadata = {
  title: "NostalgiaNet++ — Where Memories Live Forever",
  description:
    "Preserve your cherished moments in time capsules. Lock memories away, set an unlock date, and relive them years from now. A beautiful digital memory vault.",
  keywords: ["time capsule", "memories", "nostalgia", "memory vault", "journal"],
};

// Inline script — runs before hydration to apply the saved theme + color scheme.
// Prevents the "flash of wrong theme" that would otherwise happen if we
// applied data-theme in a useEffect.
const themeInitScript = `
(function() {
  try {
    var theme = localStorage.getItem('nostalgianet-theme') || 'sepia';
    var mode = localStorage.getItem('nostalgianet-color-mode') || 'light';
    var root = document.documentElement;
    if (theme && theme !== 'sepia') root.setAttribute('data-theme', theme);
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
      </body>
    </html>
  );
}
