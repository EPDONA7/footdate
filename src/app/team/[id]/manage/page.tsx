import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/clerk";
import ManageTeamClient from "./ManageTeamClient";

interface TeamManagePageProps {
  params: {
    id: string
  }
}

export default async function TeamManagePage({ params }: TeamManagePageProps) {
  // 1. Fetch user using the correct function that returns Prisma User
  const user = await getCurrentUser();
  if (!user) {
    redirect("/sign-in");
  }

  // 2. Fetch team data using Prisma safely on the server
  const teamData = await prisma.team.findUnique({
    where: { id: params.id },
    include: {
      members: {
        include: { user: true },
        orderBy: { role: 'asc' }
      },
      invitations: {
        include: { user: true },
        where: { status: 'PENDING' }
      },
      joinRequests: {
        include: {
          playerProfile: {
            include: { user: true }
          }
        },
        where: { status: 'PENDING' },
        orderBy: { createdAt: 'desc' }
      }
    }
  });

  if (!teamData) {
    notFound();
  }

  // 3. Verify the user is the owner before rendering
  const member = teamData.members.find((m: any) => m.userId === user.id);
  if (member?.role !== "OWNER") {
    redirect(`/team/${params.id}`);
  }

  // 4. Pass the data to your interactive client component
  return <ManageTeamClient team={teamData} currentUserId={user.id} />;
}