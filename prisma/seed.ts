import { PrismaClient } from '@prisma/client'
import { Position, SkillLevel, MatchType, MatchStatus, TeamRole } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting seed...')

  // Create sample users
  const users = await Promise.all([
    prisma.user.create({
      data: {
        clerkId: 'user_1',
        username: 'abebefootball',
        email: 'abebe@example.com',
        name: 'Abebe Kebede',
        bio: 'Passionate football player from Addis Ababa',
        age: 25,
        city: 'Addis Ababa',
        primaryPosition: Position.FORWARD,
        secondaryPosition: Position.MIDFIELDER,
        skillLevel: SkillLevel.ADVANCED,
        availableDays: ['Monday', 'Wednesday', 'Friday', 'Saturday'],
        preferredTimes: ['Morning', 'Evening'],
        matchesPlayed: 45,
        wins: 28,
        losses: 12,
        draws: 5,
        goals: 32,
        assists: 18,
        playerRating: 4.5
      }
    }),
    prisma.user.create({
      data: {
        clerkId: 'user_2',
        username: 'tigistgoal',
        email: 'tigist@example.com',
        name: 'Tigist Haile',
        bio: 'Goalkeeper with 8 years experience',
        age: 23,
        city: 'Addis Ababa',
        primaryPosition: Position.GOALKEEPER,
        skillLevel: SkillLevel.PROFESSIONAL,
        availableDays: ['Tuesday', 'Thursday', 'Saturday', 'Sunday'],
        preferredTimes: ['Afternoon'],
        matchesPlayed: 52,
        wins: 35,
        losses: 10,
        draws: 7,
        goals: 0,
        assists: 2,
        playerRating: 4.8
      }
    }),
    prisma.user.create({
      data: {
        clerkId: 'user_3',
        username: 'diresoccer',
        email: 'dire@example.com',
        name: 'Dawit Mekonnen',
        bio: 'Defender from Dire Dawa',
        age: 27,
        city: 'Dire Dawa',
        primaryPosition: Position.DEFENDER,
        skillLevel: SkillLevel.INTERMEDIATE,
        availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday'],
        preferredTimes: ['Evening'],
        matchesPlayed: 30,
        wins: 15,
        losses: 10,
        draws: 5,
        goals: 5,
        assists: 8,
        playerRating: 3.8
      }
    }),
    prisma.user.create({
      data: {
        clerkId: 'user_4',
        username: 'mekellestar',
        email: 'mekelle@example.com',
        name: 'Selam Tesfaye',
        bio: 'Midfielder from Mekelle',
        age: 22,
        city: 'Mekelle',
        primaryPosition: Position.MIDFIELDER,
        skillLevel: SkillLevel.ADVANCED,
        availableDays: ['Friday', 'Saturday', 'Sunday'],
        preferredTimes: ['Morning', 'Afternoon'],
        matchesPlayed: 38,
        wins: 22,
        losses: 11,
        draws: 5,
        goals: 12,
        assists: 25,
        playerRating: 4.2
      }
    }),
    prisma.user.create({
      data: {
        clerkId: 'user_5',
        username: 'newplayer',
        email: 'new@example.com',
        name: 'Kaleb Alemu',
        bio: 'Looking to join a team',
        age: 19,
        city: 'Addis Ababa',
        primaryPosition: Position.FORWARD,
        skillLevel: SkillLevel.BEGINNER,
        availableDays: ['Saturday', 'Sunday'],
        preferredTimes: ['Morning'],
        matchesPlayed: 5,
        wins: 2,
        losses: 3,
        draws: 0,
        goals: 3,
        assists: 1,
        playerRating: 3.0
      }
    })
  ])

  console.log('Created 5 users')

  // Create sample teams
  const teams = await Promise.all([
    prisma.team.create({
      data: {
        name: 'FC Addis',
        description: 'Premier football team from Addis Ababa',
        city: 'Addis Ababa',
        capacity: 20,
        matchesPlayed: 25,
        wins: 18,
        losses: 5,
        draws: 2,
        goalsFor: 58,
        goalsAgainst: 22,
        points: 56,
        members: {
          create: [
            {
              userId: users[0].id,
              role: TeamRole.OWNER
            },
            {
              userId: users[1].id,
              role: TeamRole.CAPTAIN
            }
          ]
        }
      }
    }),
    prisma.team.create({
      data: {
        name: 'Dire Dawa FC',
        description: 'Competitive team from Dire Dawa',
        city: 'Dire Dawa',
        capacity: 18,
        matchesPlayed: 20,
        wins: 12,
        losses: 6,
        draws: 2,
        goalsFor: 42,
        goalsAgainst: 28,
        points: 38,
        members: {
          create: [
            {
              userId: users[2].id,
              role: TeamRole.OWNER
            }
          ]
        }
      }
    }),
    prisma.team.create({
      data: {
        name: 'Mekelle United',
        description: 'Rising team from Mekelle',
        city: 'Mekelle',
        capacity: 22,
        matchesPlayed: 18,
        wins: 10,
        losses: 5,
        draws: 3,
        goalsFor: 35,
        goalsAgainst: 25,
        points: 33,
        members: {
          create: [
            {
              userId: users[3].id,
              role: TeamRole.OWNER
            }
          ]
        }
      }
    })
  ])

  console.log('Created 3 teams')

  // Create sample matches
  const matches = await Promise.all([
    prisma.match.create({
      data: {
        homeTeamId: teams[0].id,
        awayTeamId: teams[1].id,
        date: new Date('2026-06-20'),
        time: '15:00',
        city: 'Addis Ababa',
        venue: 'National Stadium',
        matchType: MatchType.FOOTBALL,
        skillLevel: SkillLevel.ADVANCED,
        status: MatchStatus.SCHEDULED
      }
    }),
    prisma.match.create({
      data: {
        homeTeamId: teams[1].id,
        awayTeamId: teams[2].id,
        date: new Date('2026-06-25'),
        time: '16:00',
        city: 'Dire Dawa',
        venue: 'City Arena',
        matchType: MatchType.FOOTBALL,
        skillLevel: SkillLevel.INTERMEDIATE,
        status: MatchStatus.SCHEDULED
      }
    }),
    prisma.match.create({
      data: {
        homeTeamId: teams[0].id,
        awayTeamId: teams[2].id,
        date: new Date('2026-06-15'),
        time: '14:00',
        city: 'Addis Ababa',
        venue: 'Addis Ababa Stadium',
        matchType: MatchType.FOOTBALL,
        skillLevel: SkillLevel.ADVANCED,
        status: MatchStatus.COMPLETED,
        homeTeamScore: 3,
        awayTeamScore: 1,
        homeScoreSubmitted: true,
        awayScoreSubmitted: true
      }
    })
  ])

  console.log('Created 3 matches')

  // Create sample posts
  await Promise.all([
    prisma.post.create({
      data: {
        userId: users[0].id,
        teamId: teams[0].id,
        content: 'Great practice session today! The team is looking sharp for the upcoming match against Dire Dawa FC. 💪⚽',
        type: 'general',
        images: []
      }
    }),
    prisma.post.create({
      data: {
        userId: users[1].id,
        content: 'Just finished an amazing training session. Ready for our next match! 🥅',
        type: 'general',
        images: []
      }
    }),
    prisma.post.create({
      data: {
        userId: users[2].id,
        teamId: teams[1].id,
        content: 'Looking for players to join our team in Dire Dawa. DM if interested!',
        type: 'announcement',
        images: []
      }
    })
  ])

  console.log('Created 3 posts')

  // Create sample notifications
  await Promise.all([
    prisma.notification.create({
      data: {
        userId: users[4].id,
        type: 'TEAM_INVITATION',
        title: 'Team Invitation',
        message: 'FC Addis has invited you to join their team',
        link: `/team/${teams[0].id}`
      }
    }),
    prisma.notification.create({
      data: {
        userId: users[0].id,
        type: 'MATCH_REMINDER',
        title: 'Match Reminder',
        message: 'Your match against Dire Dawa FC is scheduled for June 20, 2026',
        link: `/match/${matches[0].id}`
      }
    })
  ])

  console.log('Created 2 notifications')

  console.log('Seed completed successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
