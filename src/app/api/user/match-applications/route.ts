import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/clerk";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || undefined; // Optional status filter

    const matchRequests = await prisma.matchRequest.findMany({
      where: {
        createdById: user.id,
        ...(status && { status: status as any }),
      },
      include: {
        requestingTeam: true,
        targetTeam: true,
        createdBy: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(matchRequests, { status: 200 });
  } catch (error) {
    console.error("Error fetching user's match requests:", error);
    return NextResponse.json({ error: "Failed to fetch match requests" }, { status: 500 });
  }
}
