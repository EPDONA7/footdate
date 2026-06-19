import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/clerk"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const resolveSchema = z.object({
  resolutionNotes: z.string(),
  action: z.enum(["APPROVE_HOME", "APPROVE_AWAY", "CANCEL_MATCH"])
})

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    if (user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden - Admin only" }, { status: 403 })
    }

    const dispute = await prisma.matchDispute.findUnique({
      where: { id: params.id },
      include: {
        match: true
      }
    })

    if (!dispute) {
      return NextResponse.json({ error: "Dispute not found" }, { status: 404 })
    }

    const body = await request.json()
    const validatedData = resolveSchema.parse(body)

    // Update dispute
    const updatedDispute = await prisma.matchDispute.update({
      where: { id: params.id },
      data: {
        resolutionNotes: validatedData.resolutionNotes,
        resolvedAt: new Date(),
        resolvedById: user.id
      }
    })

    // Update match based on resolution
    if (validatedData.action === "CANCEL_MATCH") {
      await prisma.match.update({
        where: { id: dispute.matchId },
        data: { status: "CANCELLED" }
      })
    } else {
      // Get the match results to determine which score to use
      const results = await prisma.matchResult.findMany({
        where: { matchId: dispute.matchId }
      })

      let finalHomeScore: number
      let finalAwayScore: number

      if (validatedData.action === "APPROVE_HOME") {
        // Use home team's submitted score
        const homeResult = results.find((r: any) => r.submittedByTeamId === dispute.match.homeTeamId)
        finalHomeScore = homeResult?.homeScore || 0
        finalAwayScore = homeResult?.awayScore || 0
      } else {
        // Use away team's submitted score
        const awayResult = results.find((r: any) => r.submittedByTeamId === dispute.match.awayTeamId)
        finalHomeScore = awayResult?.homeScore || 0
        finalAwayScore = awayResult?.awayScore || 0
      }

      // Update match with final scores
      await prisma.match.update({
        where: { id: dispute.matchId },
        data: {
          status: "COMPLETED",
          homeTeamScore: finalHomeScore,
          awayTeamScore: finalAwayScore
        }
      })

      // Update all results to VERIFIED
      await prisma.matchResult.updateMany({
        where: { matchId: dispute.matchId },
        data: { status: "VERIFIED" }
      })

      // Update team statistics
      const homeWon = finalHomeScore > finalAwayScore
      const awayWon = finalAwayScore > finalHomeScore
      const draw = finalHomeScore === finalAwayScore

      await prisma.team.update({
        where: { id: dispute.match.homeTeamId },
        data: {
          matchesPlayed: { increment: 1 },
          wins: homeWon ? { increment: 1 } : undefined,
          draws: draw ? { increment: 1 } : undefined,
          losses: awayWon ? { increment: 1 } : undefined,
          goalsFor: { increment: finalHomeScore },
          goalsAgainst: { increment: finalAwayScore },
          points: homeWon ? { increment: 3 } : draw ? { increment: 1 } : undefined
        }
      })

      await prisma.team.update({
        where: { id: dispute.match.awayTeamId! },
        data: {
          matchesPlayed: { increment: 1 },
          wins: awayWon ? { increment: 1 } : undefined,
          draws: draw ? { increment: 1 } : undefined,
          losses: homeWon ? { increment: 1 } : undefined,
          goalsFor: { increment: finalAwayScore },
          goalsAgainst: { increment: finalHomeScore },
          points: awayWon ? { increment: 3 } : draw ? { increment: 1 } : undefined
        }
      })
    }

    // Notify both teams
    const homeTeamMembers = await prisma.teamMember.findMany({
      where: { teamId: dispute.match.homeTeamId }
    })

    const awayTeamMembers = await prisma.teamMember.findMany({
      where: { teamId: dispute.match.awayTeamId! }
    })

    const allMembers = [...homeTeamMembers, ...awayTeamMembers]

    for (const member of allMembers) {
      await prisma.notification.create({
        data: {
          userId: member.userId,
          type: "DISPUTE_RESOLUTION",
          title: "Dispute Resolved",
          message: `The dispute for your match has been resolved: ${validatedData.resolutionNotes}`,
          link: `/match/${dispute.matchId}`
        }
      })
    }

    return NextResponse.json(updatedDispute)
  } catch (error) {
    console.error("Error resolving dispute:", error)
    return NextResponse.json({ error: "Failed to resolve dispute" }, { status: 500 })
  }
}
