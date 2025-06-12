import { Geist, Geist_Mono } from "next/font/google"
import type { Metadata, Viewport } from "next"

import "./globals.css"
import { Providers } from "@/components/providers"
import { Navigation } from "@/components/navigation"
import { TeamProvider } from "@/components/team-context"
import { NetworkStatus } from "@/components/network-status"
import { PWAFeatures } from "@/components/pwa-features"

const fontSans = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
})

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export const metadata: Metadata = {
  title: "Wettkämpfe Timer",
  description: "Timer für den B-Teil beim Bundeswettbewerb der DJF mit Rundenverfolgung und Gruppen-Management",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "WK-Timer",
  },
  icons: {
    icon: "/icon.svg",
    apple: "/icon-192x192.png",
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#cf2c2a",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-TileColor" content="#cf2c2a" />
        <meta name="msapplication-tap-highlight" content="no" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
        <link rel="icon" type="image/svg+xml" href="/icon.svg" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body
        className={`${fontSans.variable} ${fontMono.variable} font-sans antialiased `}
      >
        <Providers>
          <TeamProvider>
            <div className="min-h-svh flex flex-col">
              {/* Navigation Bar */}
              <Navigation />

              {/* Main Content */}
              <main className="flex-1">
                {children}
              </main>

              {/* PWA Features Info */}
              <PWAFeatures />

              {/* Network Status */}
              <NetworkStatus />
            </div>
          </TeamProvider>
        </Providers>
      </body>
    </html>
  )
}
