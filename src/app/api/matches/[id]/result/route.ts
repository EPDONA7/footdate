import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/clerk"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const submitResultSchema = z.object({
  homeScore: z.number().min(0),
  awayScore: z.number().min(0),
  homeGoals: z.array(z.object({
    userId: z.string(),
    count: z.number().min(0)
  })).optional(),
  awayGoals: z.array(z.object({
    userId: z.string(),
    count: z.number().min(0)
  })).optional(),
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

    const match = await prisma.match.findUnique({
      where: { id: params.id },
      include: {
        homeTeam: {
          include: {
            members: true
          }
        },
        awayTeam: {
          include: {
            members: true
          }
        }
      }
    })

    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 })
    }

    // Check if user is a member of either team
    const isHomeTeamMember = match.homeTeam.members.some(m => m.userId === user.id)
    const isAwayTeamMember = match.awayTeam.members.some(m => m.userId === user.id)

    if (!isHomeTeamMember && !isAwayTeamMember) {
      return NextResponse.json({ error: "You are not a member of either team" }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = submitResultSchema.parse(body)

    // Determine which team is submitting
    const submittingTeamId = isHomeTeamMember ? match.homeTeamId : match.awayTeamId

    // Check if result already submitted by this team
    const existingResult = await prisma.matchResult.findFirst({
      where: {
        matchId: params.id,
        submittedByTeamId: submittingTeamId
      }
    })

    if (existingResult) {
      return NextResponse.json({ error: "Result already submitted by your team" }, { status: 400 })
    }

    // Create match result
    const result = await prisma.matchResult.create({
      data: {
        matchId: params.id,
        submittedByTeamId: submittingTeamId,
        homeScore: validatedData.homeScore,
        awayScore: validatedData.awayScore,
        status: "PENDING"
      }
    })

    // Check if both teams have submitted results
    const allResults = await prisma.matchResult.findMany({
      where: { matchId: params.id }
    })

    if (allResults.length === 2) {
      // Verify if results match
      const resultsMatch = allResults.every(r => 
        r.homeScore === validatedData.homeScore && 
        r.awayScore === validatedData.awayScore
      )

      if (resultsMatch) {
        // Update match status and scores
        await prisma.match.update({
          where: { id: params.id },
          data: {
            status: "COMPLETED",
            homeTeamScore: validatedData.homeScore,
            awayTeamScore: validatedData.awayScore
          }
        })

        // Update all results to VERIFIED
        await prisma.matchResult.updateMany({
          where: { matchId: params.id },
          data: { status: "VERIFIED" }
        })

        // Update team statistics
        const homeWon = validatedData.homeScore > validatedData.awayScore
        const awayWon = validatedData.awayScore > validatedData.homeScore
        const draw = validatedData.homeScore === validatedData.awayScore

        // Update home team stats
        await prisma.team.update({
          where: { id: match.homeTeamId },
          data: {
            matchesPlayed: { increment: 1 },
            wins: homeWon ? { increment: 1 } : undefined,
            draws: draw ? { increment: 1 } : undefined,
            losses: awayWon ? { increment: 1 } : undefined,
            goalsFor: { increment: validatedData.homeScore },
            goalsAgainst: { increment: validatedData.awayScore },
            points: homeWon ? { increment: 3 } : draw ? { increment: 1 } : undefined
          }
        })

        // Update away team stats
        await prisma.team.update({
          where: { id: match.awayTeamId! },
          data: {
            matchesPlayed: { increment: 1 },
            wins: awayWon ? { increment: 1 } : undefined,
            draws: draw ? { increment: 1 } : undefined,
            losses: homeWon ? { increment: 1 } : undefined,
            goalsFor: { increment: validatedData.awayScore },
            goalsAgainst: { increment: validatedData.homeScore },
            points: awayWon ? { increment: 3 } : draw ? { increment: 1 } : undefined
          }
        })

        // Update player statistics
        if (validatedData.homeGoals) {
          for (const goal of validatedData.homeGoals) {
            await prisma.user.update({
              where: { id: goal.userId },
              data: {
                goals: { increment: goal.count },
                matchesPlayed: { increment: 1 },
                wins: homeWon ? { increment: 1 } : undefined,
                draws: draw ? { increment: 1 } : undefined,
                losses: awayWon ? { increment: 1 } : undefined
              }
            })
          }
        }

        if (validatedData.awayGoals) {
          for (const goal of validatedData.awayGoals) {
            await prisma.user.update({
              where: { id: goal.userId },
              data: {
                goals: { increment: goal.count },
                matchesPlayed: { increment: 1 },
                wins: awayWon ? { increment: 1 } : undefined,
                draws: draw ? { increment: 1 } : undefined,
                losses: homeWon ? { increment: 1 } : undefined
              }
            })
          }
        }
      } else {
        // Results don't match, create dispute
        await prisma.matchDispute.create({
          data: {
            matchId: params.id,
            reportedById: user.id,
            reason: "Result mismatch between teams",
            status: "OPEN"
          }
        })

        await prisma.match.update({
          where: { id: params.id },
          data: { status: "DISPUTED" }
        })
      }
    }

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error("Error submitting match result:", error)
    return NextResponse.json({ error: "Failed to submit match result" }, { status: 500 })
  }
}
