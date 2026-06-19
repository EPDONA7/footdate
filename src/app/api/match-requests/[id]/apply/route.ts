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
    const { teamId } = await request.json(); // The team applying to the match request

    // Verify the team exists and the user is a member/manager of it
    const teamMember = await prisma.teamMember.findFirst({
      where: {
        teamId: teamId,
        userId: user.id,
        OR: [{ role: "OWNER" }, { role: "MANAGER" }],
      },
    });

    if (!teamMember) {
      return NextResponse.json({ error: "You are not authorized to apply with this team." }, { status: 403 });
    }

    const matchRequest = await prisma.matchRequest.findUnique({
      where: { id },
      include: {
        requestingTeam: true,
        createdBy: true,
      },
    });

    if (!matchRequest) {
      return NextResponse.json({ error: "Match request not found." }, { status: 404 });
    }

    if (matchRequest.status !== "OPEN") {
      return NextResponse.json({ error: "This match request is not open for applications." }, { status: 400 });
    }

    // Prevent a team from applying to its own request
    if (matchRequest.requestingTeamId === teamId) {
      return NextResponse.json({ error: "Cannot apply to your own match request." }, { status: 400 });
    }

    const existingApplication = await prisma.matchRequest.findFirst({
      where: {
        id: id,
        targetTeamId: teamId,
        status: "PENDING",
      },
    });

    if (existingApplication) {
      return NextResponse.json({ error: "Your team has already applied to this match request." }, { status: 400 });
    }

    // We'll allow multiple applications but only one can be accepted. The `targetTeamId` will be set when the creator accepts.
    // If we want to strictly enforce one pending application at a time, we'd need a separate model for applications.

    // For now, let's just create a notification for the creator.
    // The `targetTeamId` will be set when the creator ACCEPTS an application.

    // Fetch the requesting team's name for the notification
    const applyingTeam = await prisma.team.findUnique({
      where: { id: teamId },
      select: { name: true },
    });

    if (!applyingTeam) {
      return NextResponse.json({ error: "Applying team not found." }, { status: 404 });
    }

    // Create a new MatchApplication entry (or update if one exists and status allows)
    // For now, we will create a notification, and the MatchRequest status will be updated by the creator.

    // Notify the match request creator about the new application
    await prisma.notification.create({
      data: {
        userId: matchRequest.createdById,
        type: "MATCH_APPLICATION_RECEIVED",
        title: `New Match Application for your request!`,
        message: `${applyingTeam.name} has applied to your match request for ${matchRequest.date.toDateString()}.`,
        link: `/dashboard/match-requests/${id}`,
      },
    });

    // Return the original match request, as its status isn't changing on application
    return NextResponse.json(matchRequest, { status: 200 });
  } catch (error) {
    console.error("Error applying to match request:", error);
    return NextResponse.json({ error: "Failed to apply to match request." }, { status: 500 });
  }
}
