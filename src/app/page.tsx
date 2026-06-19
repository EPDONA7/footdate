import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Trophy, Calendar, MapPin } from "lucide-react"

export default function Home() {
  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary/10 via-background to-secondary/10 py-20 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            FOOTDATE
          </h1>
          <p className="text-2xl md:text-3xl mb-4 text-muted-foreground">
            Find Players. Find Teams. Play Football.
          </p>
          <p className="text-lg mb-8 text-muted-foreground max-w-2xl mx-auto">
            Ethiopia's premier football and futsal community platform. Connect with players, join teams, and compete in matches across the country.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/match-finder">
              <Button size="lg" className="w-full sm:w-auto">
                Find a Match
              </Button>
            </Link>
            <Link href="/marketplace">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                Find a Team
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button size="lg" variant="secondary" className="w-full sm:w-auto">
                Create a Team
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="py-16 px-4 bg-muted/50">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <Users className="h-12 w-12 mx-auto mb-4 text-primary" />
              <div className="text-3xl font-bold">5,000+</div>
              <div className="text-muted-foreground">Active Players</div>
            </div>
            <div className="text-center">
              <Trophy className="h-12 w-12 mx-auto mb-4 text-primary" />
              <div className="text-3xl font-bold">500+</div>
              <div className="text-muted-foreground">Active Teams</div>
            </div>
            <div className="text-center">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-primary" />
              <div className="text-3xl font-bold">2,000+</div>
              <div className="text-muted-foreground">Matches Played</div>
            </div>
            <div className="text-center">
              <MapPin className="h-12 w-12 mx-auto mb-4 text-primary" />
              <div className="text-3xl font-bold">50+</div>
              <div className="text-muted-foreground">Courts Listed</div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">How FOOTDATE Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-6 w-6 text-primary" />
                  Create Your Profile
                </CardTitle>
                <CardDescription>
                  Sign up and build your football profile with your position, skill level, and availability.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-6 w-6 text-primary" />
                  Join or Create Teams
                </CardTitle>
                <CardDescription>
                  Find existing teams in your city or create your own and invite players to join.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-6 w-6 text-primary" />
                  Play & Compete
                </CardTitle>
                <CardDescription>
                  Find matches, track your stats, climb the rankings, and become the best in Ethiopia.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 bg-muted/50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Platform Features</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-2">Player Profiles</h3>
                <p className="text-sm text-muted-foreground">Detailed profiles with stats, positions, and availability</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-2">Team Management</h3>
                <p className="text-sm text-muted-foreground">Create teams, manage rosters, and track team statistics</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-2">Match Finder</h3>
                <p className="text-sm text-muted-foreground">Find opponents and schedule matches with filters</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-2">Rankings System</h3>
                <p className="text-sm text-muted-foreground">Competitive rankings by city and time period</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-2">Player Marketplace</h3>
                <p className="text-sm text-muted-foreground">Discover and recruit talented players</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-2">Community Feed</h3>
                <p className="text-sm text-muted-foreground">Share results, photos, and team announcements</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Play?</h2>
          <p className="text-lg text-muted-foreground mb-8">
            Join thousands of football players across Ethiopia and start your journey today.
          </p>
          <Link href="/sign-up">
            <Button size="lg">
              Get Started Now
            </Button>
          </Link>
        </div>
      </section>
    </main>
  )
}
