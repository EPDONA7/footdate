import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/clerk"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const respondSchema = z.object({
  action: z.enum(["ACCEPT", "REJECT"]),
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

    const body = await request.json()
    const { action } = respondSchema.parse(body)

    const application = await prisma.matchApplication.findUnique({
      where: { id: params.id },
      include: {
        applyingTeam: true,
        matchRequest: {
          include: { requestingTeam: true },
        },
      },
    })

    if (!application) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 })
    }

    const matchRequest = application.matchRequest

    // Authorize: only the creator or an owner of the requesting team may respond
    const requestingMembership = await prisma.teamMember.findFirst({
      where: { teamId: matchRequest.requestingTeamId, userId: user.id, role: "OWNER" },
    })
    if (matchRequest.createdById !== user.id && !requestingMembership) {
      return NextResponse.json({ error: "You are not allowed to respond to this application" }, { status: 403 })
    }

    if (application.status !== "PENDING") {
      return NextResponse.json({ error: "This application has already been processed" }, { status: 400 })
    }

    if (action === "REJECT") {
      await prisma.matchApplication.update({
        where: { id: application.id },
        data: { status: "REJECTED" },
      })

      await prisma.notification.create({
        data: {
          userId: application.appliedById,
          type: "MATCH_REJECTED",
          title: "Match Application Rejected",
          message: `${matchRequest.requestingTeam.name} declined your application to play in ${matchRequest.city}`,
          link: `/match-finder`,
        },
      })

      return NextResponse.json({ message: "Application rejected" })
    }

    // ACCEPT
    const createdMatch = await prisma.$transaction(async (tx) => {
      // Mark this application accepted
      await tx.matchApplication.update({
        where: { id: application.id },
        data: { status: "ACCEPTED" },
      })

      // Reject all other pending applications on this request
      const others = await tx.matchApplication.findMany({
        where: {
          matchRequestId: matchRequest.id,
          id: { not: application.id },
          status: "PENDING",
        },
      })

      for (const other of others) {
        await tx.matchApplication.update({
          where: { id: other.id },
          data: { status: "REJECTED" },
        })
        await tx.notification.create({
          data: {
            userId: other.appliedById,
            type: "MATCH_REJECTED",
            title: "Match Application Rejected",
            message: `${matchRequest.requestingTeam.name} selected another team for the match in ${matchRequest.city}`,
            link: `/match-finder`,
          },
        })
      }

      // Lock the request to the accepted team
      await tx.matchRequest.update({
        where: { id: matchRequest.id },
        data: { status: "ACCEPTED", targetTeamId: application.applyingTeamId },
      })

      // Create the scheduled match (open for spectators)
      const match = await tx.match.create({
        data: {
          homeTeamId: matchRequest.requestingTeamId,
          awayTeamId: application.applyingTeamId,
          createdById: matchRequest.createdById,
          date: matchRequest.date,
          time: matchRequest.time,
          city: matchRequest.city,
          venue: matchRequest.venue,
          futsalLocation: matchRequest.futsalLocation,
          image: matchRequest.image,
          matchType: matchRequest.matchType,
          skillLevel: matchRequest.skillLevel,
          status: "SCHEDULED",
          openForSpectators: true,
        },
      })

      // Notify the applicant
      await tx.notification.create({
        data: {
          userId: application.appliedById,
          type: "MATCH_ACCEPTED",
          title: "Match Application Accepted",
          message: `${matchRequest.requestingTeam.name} accepted your application! The match is scheduled in ${matchRequest.city}.`,
          link: `/match-finder`,
        },
      })

      return match
    })

    return NextResponse.json({ message: "Application accepted", matchId: createdMatch.id })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request data" }, { status: 400 })
    }
    console.error("Error responding to match application:", error)
    return NextResponse.json({ error: "Failed to respond to application" }, { status: 500 })
  }
}
