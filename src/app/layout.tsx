import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ClerkProvider } from "@clerk/nextjs"
import { Navigation } from "@/components/navigation"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "FOOTDATE - Find Players. Find Teams. Play Football.",
  description: "A football and futsal community platform focused on Ethiopia",
  openGraph: {
    title: "FOOTDATE",
    description:
      "Find football players, teams and matches.",
    url: "https://footdate.live",
    siteName: "FOOTDATE",
    type: "website",
    images: [
      {
        url: "https://footdate.live/og-image.png",
        width: 1200,
        height: 630,
      },
    ],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={inter.className}>
          <Navigation />
          {children}
        </body>
      </html>
    </ClerkProvider>
  )
}
