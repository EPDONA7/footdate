"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { syncUserWithClerk } from "@/lib/clerk";

export async function createTeam(formData: FormData) {
  const user = await syncUserWithClerk();

  if (!user) {
    redirect("/sign-in");
  }

  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const city = formData.get("city") as string;
  const capacity = Number(formData.get("capacity")) || 20;

  const team = await prisma.team.create({
    data: {
      name,
      description,
      city,
      capacity,

      members: {
        create: {
          userId: user.id,
          role: "OWNER",
        },
      },
    },
  });

  redirect(`/team/${team.id}`);
}