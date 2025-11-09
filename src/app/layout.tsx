import { type Metadata, type Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import { ThemeProvider } from "@/components/theme-provider";
import { cn } from "@/lib/utils";

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://example.com"),
  title: {
    default: "Panel operacyjny",
    template: "%s • Panel operacyjny",
  },
  description:
    "Panel do zarządzania montażami i kanałem dropshipping paneli fotowoltaicznych.",
  applicationName: "Panel operacyjny",
  authors: [{ name: "Zespół operacyjny" }],
  icons: [{ rel: "icon", url: "/favicon.ico" }],
  keywords: ["montaże", "dropshipping", "panele", "panel SaaS"],
};

export const viewport: Viewport = {
  themeColor: "#f5f3ff",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pl" suppressHydrationWarning>
      <body className={cn("min-h-screen bg-background", geistSans.variable, geistMono.variable)}>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
