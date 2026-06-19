import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/clerk";
import { prisma } from "@/lib/prisma";

interface TeamInvitationContext {
  params: {
    id: string;
  };
}

export async function PUT(request: NextRequest, { params }: TeamInvitationContext) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    const { status } = await request.json(); // Expected: "ACCEPTED" or "DECLINED"

    if (!["ACCEPTED", "DECLINED"].includes(status)) {
      return NextResponse.json({ error: "Invalid status provided." }, { status: 400 });
    }

    const invitation = await prisma.teamInvitation.findUnique({
      where: { id },
      include: {
        team: true,
        user: true,
        invitingUser: true,
      },
    });

    if (!invitation) {
      return NextResponse.json({ error: "Invitation not found." }, { status: 404 });
    }

    if (invitation.userId !== user.id) {
      return NextResponse.json({ error: "You are not authorized to respond to this invitation." }, { status: 403 });
    }

    if (invitation.status !== "PENDING") {
      return NextResponse.json({ error: "This invitation has already been responded to." }, { status: 400 });
    }

    const updatedInvitation = await prisma.teamInvitation.update({
      where: { id },
      data: {
        status,
        respondedAt: new Date(),
      },
      include: {
        team: true,
        user: true,
        invitingUser: true,
      },
    });

    if (status === "ACCEPTED") {
      // Add user to the team
      await prisma.teamMember.create({
        data: {
          teamId: invitation.teamId,
          userId: invitation.userId,
          role: "PLAYER", // Default role
        },
      });

      // Notify the inviting user
      await prisma.notification.create({
        data: {
          userId: invitation.invitedBy,
          type: "INVITATION_ACCEPTED",
          title: `Invitation Accepted: ${invitation.team.name}`,
          message: `${invitation.user.name || invitation.user.username} has accepted your invitation to join ${invitation.team.name}.`,
          link: `/team/${invitation.teamId}`,
        },
      });
    } else if (status === "DECLINED") {
      // Notify the inviting user
      await prisma.notification.create({
        data: {
          userId: invitation.invitedBy,
          type: "INVITATION_DECLINED",
          title: `Invitation Declined: ${invitation.team.name}`,
          message: `${invitation.user.name || invitation.user.username} has declined your invitation to join ${invitation.team.name}.`,
          link: `/team/${invitation.teamId}`,
        },
      });
    }

    return NextResponse.json(updatedInvitation, { status: 200 });
  } catch (error) {
    console.error("Error responding to team invitation:", error);
    return NextResponse.json({ error: "Failed to respond to team invitation." }, { status: 500 });
  }
}
