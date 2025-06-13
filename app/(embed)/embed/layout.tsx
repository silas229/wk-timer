import { Geist, Geist_Mono } from "next/font/google"
import type { Metadata, Viewport } from "next"

import "../../globals.css"
import { Providers } from "@/components/providers"

const fontSans = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
})

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export const metadata: Metadata = {
  robots: "noindex, nofollow",
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function EmbedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de" suppressHydrationWarning>
      <head>
        {/* Allow iframe embedding from any origin */}
        <meta httpEquiv="X-Frame-Options" content="ALLOWALL" />
        {/* Modern alternative to X-Frame-Options */}
        <meta httpEquiv="Content-Security-Policy" content="frame-ancestors *;" />
        {/* Additional headers for iframe embedding */}
        <meta name="referrer" content="no-referrer-when-downgrade" />
      </head>
      <body
        className={`${fontSans.variable} ${fontMono.variable} font-sans antialiased bg-background`}
        suppressHydrationWarning
      >
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
