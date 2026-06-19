import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/clerk";
import { prisma } from "@/lib/prisma";

interface MatchRequestContext {
  params: {
    id: string;
  };
}

export async function POST(request: NextRequest, { params }: MatchRequestContext) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    const { status } = await request.json(); // Expected: "ACCEPTED" or "REJECTED"

    if (!["ACCEPTED", "REJECTED"].includes(status)) {
      return NextResponse.json({ error: "Invalid status provided." }, { status: 400 });
    }

    const matchRequest = await prisma.matchRequest.findUnique({
      where: { id },
      include: {
        requestingTeam: true,
        targetTeam: true,
        createdBy: true,
      },
    });

    if (!matchRequest) {
      return NextResponse.json({ error: "Match request not found." }, { status: 404 });
    }

    // Only the creator of the match request can accept/reject applications
    if (matchRequest.createdById !== user.id) {
      return NextResponse.json({ error: "You are not authorized to respond to this match request." }, { status: 403 });
    }

    // Ensure there is a target team to respond to
    if (!matchRequest.targetTeamId) {
      return NextResponse.json({ error: "No team has applied to this match request yet." }, { status: 400 });
    }

    // Update the match request status
    const updatedMatchRequest = await prisma.matchRequest.update({
      where: { id },
      data: {
        status: status as any, // Update status to ACCEPTED or REJECTED
      },
      include: {
        requestingTeam: true,
        targetTeam: true,
        createdBy: true,
      },
    });

    // Notify the target team (the applicant)
    if (updatedMatchRequest.targetTeamId && updatedMatchRequest.targetTeam) {
      // Fetch members of the target team to notify all relevant users
      const targetTeamMembers = await prisma.teamMember.findMany({
        where: { teamId: updatedMatchRequest.targetTeamId },
        select: { userId: true },
      });

      if (status === "ACCEPTED") {
        for (const member of targetTeamMembers) {
          await prisma.notification.create({
            data: {
              userId: member.userId,
              type: "MATCH_APPLICATION_ACCEPTED",
              title: `Match Request Accepted!`,
              message: `${updatedMatchRequest.requestingTeam.name} has accepted your application for the match on ${updatedMatchRequest.date.toDateString()}.`,
              link: `/matches/${updatedMatchRequest.id}`,
            },
          });
        }
        // Optionally, create a new Match entry here if the match is officially accepted
      } else if (status === "REJECTED") {
        for (const member of targetTeamMembers) {
          await prisma.notification.create({
            data: {
              userId: member.userId,
              type: "MATCH_APPLICATION_REJECTED",
              title: `Match Request Rejected`,
              message: `${updatedMatchRequest.requestingTeam.name} has rejected your application for the match on ${updatedMatchRequest.date.toDateString()}.`,
              link: `/match-requests/${updatedMatchRequest.id}`,
            },
          });
        }
      }
    }

    return NextResponse.json(updatedMatchRequest, { status: 200 });
  } catch (error) {
    console.error("Error responding to match application:", error);
    return NextResponse.json({ error: "Failed to respond to match application." }, { status: 500 });
  }
}
