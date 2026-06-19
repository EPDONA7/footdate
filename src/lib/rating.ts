import { prisma } from "./prisma"

export async function calculatePlayerRating(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      matchParticipants: {
        include: {
          match: true
        }
      }
    }
  })

  if (!user || user.matchesPlayed === 0) {
    return 0
  }

  // Base rating starts at 3.0
  let rating = 3.0

  // Performance factors
  const goalsPerMatch = user.goals / user.matchesPlayed
  const assistsPerMatch = user.assists / user.matchesPlayed
  const winRate = user.wins / user.matchesPlayed
  const mvpRate = user.mvpAwards / user.matchesPlayed

  // Goals contribution (max +0.5)
  rating += Math.min(goalsPerMatch * 0.1, 0.5)

  // Assists contribution (max +0.3)
  rating += Math.min(assistsPerMatch * 0.15, 0.3)

  // Win rate contribution (max +1.0)
  rating += winRate * 1.0

  // MVP awards contribution (max +0.2)
  rating += Math.min(mvpRate * 0.5, 0.2)

  // Cap at 5.0
  rating = Math.min(rating, 5.0)

  // Update user rating
  await prisma.user.update({
    where: { id: userId },
    data: { playerRating: rating }
  })

  return rating
}

export async function updateAllPlayerRatings() {
  const users = await prisma.user.findMany({
    where: {
      matchesPlayed: {
        gt: 0
      }
    }
  })

  for (const user of users) {
    await calculatePlayerRating(user.id)
  }

  return users.length
}
