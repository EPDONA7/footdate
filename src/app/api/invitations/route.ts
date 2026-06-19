import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/clerk";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createTeamInvitationSchema = z.object({
  teamId: z.string(),
  userId: z.string(), // The ID of the user being invited
});

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createTeamInvitationSchema.parse(body);

    // Check if the inviting user is an owner or manager of the team
    const teamMember = await prisma.teamMember.findFirst({
      where: {
        teamId: validatedData.teamId,
        userId: user.id,
        OR: [{ role: "OWNER" }, { role: "MANAGER" }],
      },
    });

    if (!teamMember) {
      return NextResponse.json({ error: "You don't have permission to invite to this team." }, { status: 403 });
    }

    // Check if the invited user already exists in the team
    const existingTeamMember = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: { teamId: validatedData.teamId, userId: validatedData.userId },
      },
    });

    if (existingTeamMember) {
      return NextResponse.json({ error: "User is already a member of this team." }, { status: 409 });
    }

    // Check if a pending invitation already exists
    const existingInvitation = await prisma.teamInvitation.findFirst({
      where: {
        teamId: validatedData.teamId,
        userId: validatedData.userId,
        status: "PENDING",
      },
    });

    if (existingInvitation) {
      return NextResponse.json({ error: "A pending invitation already exists for this user." }, { status: 409 });
    }

    const newInvitation = await prisma.teamInvitation.create({
      data: {
        teamId: validatedData.teamId,
        userId: validatedData.userId,
        invitedBy: user.id,
        status: "PENDING",
      },
      include: {
        team: true,
        user: true,
        invitingUser: true,
      },
    });

    // Create a notification for the invited user
    await prisma.notification.create({
      data: {
        userId: validatedData.userId,
        type: "TEAM_INVITATION",
        title: `Team Invitation from ${newInvitation.team.name}`,
        message: `${newInvitation.invitingUser.name || newInvitation.invitingUser.username} has invited you to join ${newInvitation.team.name}.`,
        link: `/invitations/${newInvitation.id}`,
      },
    });

    return NextResponse.json(newInvitation, { status: 201 });
  } catch (error) {
    console.error("Error creating team invitation:", error);
    return NextResponse.json({ error: "Failed to create team invitation." }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "PENDING";

    const invitations = await prisma.teamInvitation.findMany({
      where: {
        userId: user.id,
        status: status as any,
      },
      include: {
        team: true,
        invitingUser: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(invitations, { status: 200 });
  } catch (error) {
    console.error("Error fetching user team invitations:", error);
    return NextResponse.json({ error: "Failed to fetch team invitations." }, { status: 500 });
  }
}
