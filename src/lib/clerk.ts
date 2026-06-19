import { clerkClient, currentUser } from '@clerk/nextjs/server'
import { prisma } from './prisma'

export async function syncUserWithClerk() {
  const user = await currentUser()
  if (!user) return null

  const existingUser = await prisma.user.findUnique({
    where: { clerkId: user.id }
  })

  if (existingUser) {
    return existingUser
  }

  // Get email safely
  const email = user.emailAddresses?.[0]?.emailAddress
  if (!email) {
    throw new Error('User must have at least one email address')
  }

  const username = user.username || email.split('@')[0]
  
  const newUser = await prisma.user.create({
    data: {
      clerkId: user.id,
      username,
      email,
      name: user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.firstName || username,
      profilePhoto: user.imageUrl,
    }
  })

  return newUser
}

export async function getCurrentUser() {
  const user = await currentUser()
  if (!user) return null

  return await prisma.user.findUnique({
    where: { clerkId: user.id }
  })
}
