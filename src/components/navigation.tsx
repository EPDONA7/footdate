import Link from "next/link"
import { Trophy } from "lucide-react"

export function Navigation() {
  return (
    <nav className="border-b bg-background">
      <div className="container mx-auto px-4 py-4">
        <Link href="/dashboard" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <Trophy className="h-6 w-6 text-primary" />
          <span className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            FOOTDATE
          </span>
        </Link>
      </div>
    </nav>
  )
}
