import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/clerk";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const applySchema = z.object({
  teamId: z.string(),
  message: z.string().max(500).optional(),
});

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
    let body: unknown = {};
    try {
      body = await request.json();
    } catch {
      body = {};
    }
    const { teamId, message } = applySchema.parse(body);

    // Verify the team exists and the user is a member/manager of it
    const teamMember = await prisma.teamMember.findFirst({
      where: {
        teamId: teamId,
        userId: user.id,
        OR: [{ role: "OWNER" }, { role: "MANAGER" }],
      },
      include: { team: true }
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

    // Only open random requests can be applied to
    if (matchRequest.targetTeamId) {
      return NextResponse.json({ error: "This is a specific invitation, not an open request" }, { status: 400 });
    }

    // Prevent a team from applying to its own request
    if (matchRequest.requestingTeamId === teamId) {
      return NextResponse.json({ error: "Cannot apply to your own match request." }, { status: 400 });
    }

    // Prevent duplicate applications
    const existing = await prisma.matchApplication.findUnique({
      where: {
        matchRequestId_applyingTeamId: {
          matchRequestId: matchRequest.id,
          applyingTeamId: teamId,
        }
      }
    });

    if (existing) {
      return NextResponse.json({ error: "Your team has already applied to this match request." }, { status: 400 });
    }

    const application = await prisma.matchApplication.create({
      data: {
        matchRequestId: matchRequest.id,
        applyingTeamId: teamId,
        appliedById: user.id,
        message: message || null,
      },
      include: {
        applyingTeam: true,
      }
    });

    // Notify the match request creator about the new application
    await prisma.notification.create({
      data: {
        userId: matchRequest.createdById,
        type: "MATCH_APPLICATION_RECEIVED",
        title: "New Match Application",
        message: `${teamMember.team.name} applied to your match request in ${matchRequest.city}`,
        link: `/match-finder/applications`,
      },
    });

    return NextResponse.json(application, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request data" }, { status: 400 });
    }
    console.error("Error applying to match request:", error);
    return NextResponse.json({ error: "Failed to apply to match request." }, { status: 500 });
  }
}
