import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Suspense } from "react";
import { LayoutBody } from "@/components/layout-body.client";
import AppShell from "@/components/app-shell";
import { ThemeProvider } from "next-themes";
import { ToastProvider } from "@/components/ui/toaster";
import { NProgressProvider } from "@/components/nprogress.client";

const inter = Inter({ variable: "--font-sans", subsets: ["latin"] });
const jetbrains = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Prime Podłoga",
    template: "%s – Prime Podłoga",
  },
  description: "Panel zarządzania Prime Podłoga",
};

// Ensure proper mobile scaling and safe-area handling on iOS
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pl" suppressHydrationWarning>
      <body className={`${inter.variable} ${jetbrains.variable} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          storageKey="pp-theme-v2"
        >
          <ToastProvider>
            <Providers>
              <Suspense fallback={null}>
                <NProgressProvider />
              </Suspense>
              <a
                href="#main-content"
                className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] focus:bg-[var(--pp-panel)] focus:border focus:px-3 focus:py-2 rounded-md"
              >
                Pomiń do treści
              </a>
              <AppShell>
                <LayoutBody>{children}</LayoutBody>
              </AppShell>
            </Providers>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
