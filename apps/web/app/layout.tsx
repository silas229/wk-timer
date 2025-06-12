import { Geist, Geist_Mono } from "next/font/google"

import "@workspace/ui/globals.css"
import { Providers } from "@/components/providers"
import { Navigation } from "@/components/navigation"
import { TeamProvider } from "@/components/team-context"

const fontSans = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
})

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
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
            </div>
          </TeamProvider>
        </Providers>
      </body>
    </html>
  )
}
