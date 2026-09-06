import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = { title: "TOTALITY — Crypto Portfolio", description: "A unified view of your digital assets." }

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en" className="bg-background"><body>{children}</body></html> }
