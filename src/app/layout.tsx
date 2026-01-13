import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Playfair_Display } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { DensityProvider } from "@/components/density-provider";
import { VersionChecker } from "@/components/system/version-checker";
import { OfflineIndicator } from "@/components/system/offline-indicator";
import { UserProvider } from "@/lib/auth/client";
import { getCurrentSession } from "@/lib/auth/session";
import { cookies } from "next/headers";
import { QueryProvider } from "@/components/providers/query-provider";
import { getShopConfig } from "@/app/dashboard/settings/shop/actions";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    template: "%s | Prime Podłoga",
    default: "Prime Podłoga",
  },
  description: "System zarządzania firmą",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const density = (cookieStore.get("density")?.value as "comfortable" | "compact") || "comfortable";
  const session = await getCurrentSession();
  const shopConfig = await getShopConfig();

  return (
    <html lang="pl" suppressHydrationWarning data-density={density}>
      <head>
          {shopConfig.noIndex && <meta name="robots" content="noindex, nofollow" />}
          
          {(shopConfig.organizationLogo || shopConfig.contactPhone) && (
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "Organization",
                        "url": "https://primepodloga.pl",
                        "name": "Prime Podłoga",
                        "logo": shopConfig.organizationLogo,
                        "contactPoint": shopConfig.contactPhone ? [{
                            "@type": "ContactPoint",
                            "telephone": shopConfig.contactPhone,
                            "email": shopConfig.contactEmail,
                            "contactType": "customer service"
                        }] : [],
                        "sameAs": [
                            shopConfig.socialFacebook,
                            shopConfig.socialInstagram
                        ].filter(Boolean)
                    })
                }}
            />
        )}
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${playfair.variable} antialiased overflow-x-hidden`}
      >
        {shopConfig.googleAnalyticsId && (
            <>
               <script async src={`https://www.googletagmanager.com/gtag/js?id=${shopConfig.googleAnalyticsId}`}></script>
               <script
                   dangerouslySetInnerHTML={{
                       __html: `
                           window.dataLayer = window.dataLayer || [];
                           function gtag(){dataLayer.push(arguments);}
                           gtag('js', new Date());
                           gtag('config', '${shopConfig.googleAnalyticsId}');
                       `
                   }}
               />
            </>
         )}
        <QueryProvider>
          <UserProvider initialUser={session?.user ?? null}>
            <DensityProvider initialDensity={density}>
              <ThemeProvider
                  attribute="class"
                  defaultTheme="light"
                  enableSystem
                  disableTransitionOnChange
                >
                  {children}
                  <Toaster position="top-center" />
                  <VersionChecker />
                  <OfflineIndicator />
              </ThemeProvider>
            </DensityProvider>
          </UserProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
