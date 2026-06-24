import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function clearAllTeamData() {
  console.log('🗑️  Starting database cleanup...')
  
 console.log("Deleting global chat messages...")
const deletedGlobalMessages = await prisma.globalMessage.deleteMany({})
console.log(`✅ Deleted ${deletedGlobalMessages.count} global messages`)

try {
    // Step 1: Delete all messages (child of conversations)
    console.log('Deleting messages...')
    const deletedMessages = await prisma.message.deleteMany({})
    console.log(`✅ Deleted ${deletedMessages.count} messages`)

    // Step 2: Delete all conversations (child of teams and users)
    console.log('Deleting conversations...')
    const deletedConversations = await prisma.conversation.deleteMany({})
    console.log(`✅ Deleted ${deletedConversations.count} conversations`)

    // Step 3: Delete match participants (child of matches)
    console.log('Deleting match participants...')
    const deletedMatchParticipants = await prisma.matchParticipant.deleteMany({})
    console.log(`✅ Deleted ${deletedMatchParticipants.count} match participants`)

    // Step 4: Delete match results (child of matches)
    console.log('Deleting match results...')
    const deletedMatchResults = await prisma.matchResult.deleteMany({})
    console.log(`✅ Deleted ${deletedMatchResults.count} match results`)

    // Step 5: Delete match disputes (child of matches)
    console.log('Deleting match disputes...')
    const deletedMatchDisputes = await prisma.matchDispute.deleteMany({})
    console.log(`✅ Deleted ${deletedMatchDisputes.count} match disputes`)

    // Step 6: Delete match spectators (child of matches)
    console.log('Deleting match spectators...')
    const deletedMatchSpectators = await prisma.matchSpectator.deleteMany({})
    console.log(`✅ Deleted ${deletedMatchSpectators.count} match spectators`)

    // Step 7: Delete match posts (child of matches)
    console.log('Deleting match posts...')
    const deletedMatchPosts = await prisma.post.deleteMany({
      where: {
        matchId: {
          not: null
        }
      }
    })
    console.log(`✅ Deleted ${deletedMatchPosts.count} match posts`)

    // Step 8: Delete all matches (child of teams)
    console.log('Deleting matches...')
    const deletedMatches = await prisma.match.deleteMany({})
    console.log(`✅ Deleted ${deletedMatches.count} matches`)

    // Step 9: Delete match applications (child of teams)
    console.log('Deleting match applications...')
    const deletedMatchApplications = await prisma.matchApplication.deleteMany({})
    console.log(`✅ Deleted ${deletedMatchApplications.count} match applications`)

    // Step 10: Delete match requests (child of teams)
    console.log('Deleting match requests...')
    const deletedMatchRequests = await prisma.matchRequest.deleteMany({})
    console.log(`✅ Deleted ${deletedMatchRequests.count} match requests`)

    // Step 11: Delete team join requests (child of teams)
    console.log('Deleting team join requests...')
    const deletedJoinRequests = await prisma.joinRequest.deleteMany({})
    console.log(`✅ Deleted ${deletedJoinRequests.count} team join requests`)

    // Step 12: Delete team invitations (child of teams)
    console.log('Deleting team invitations...')
    const deletedTeamInvitations = await prisma.teamInvitation.deleteMany({})
    console.log(`✅ Deleted ${deletedTeamInvitations.count} team invitations`)

    // Step 13: Delete team members (child of teams)
    console.log('Deleting team members...')
    const deletedTeamMembers = await prisma.teamMember.deleteMany({})
    console.log(`✅ Deleted ${deletedTeamMembers.count} team members`)

    // Step 14: Delete all teams (parent)
    console.log('Deleting teams...')
    const deletedTeams = await prisma.team.deleteMany({})
    console.log(`✅ Deleted ${deletedTeams.count} teams`)

    // Step 15: Clean up related notifications
    console.log('Cleaning up team-related notifications...')
    const deletedNotifications = await prisma.notification.deleteMany({
      where: {
        type: {
          in: [
  "TEAM_INVITATION",
  "INVITATION_ACCEPTED",
  "INVITATION_DECLINED",
  "TEAM_ANNOUNCEMENT"
]
        }
      }
    })
    console.log(`✅ Deleted ${deletedNotifications.count} team-related notifications`)

    // Step 16: Clean up player profiles (optional - remove if you want to keep them)
    console.log('Deleting player profiles...')
    const deletedPlayerProfiles = await prisma.playerProfile.deleteMany({})
    console.log(`✅ Deleted ${deletedPlayerProfiles.count} player profiles`)

    console.log('\n🎉 Database cleanup completed successfully!')
    console.log('\n📊 Summary:')
    console.log(`   - Messages: ${deletedMessages.count}`)
    console.log(`   - Conversations: ${deletedConversations.count}`)
    console.log(`   - Match Participants: ${deletedMatchParticipants.count}`)
    console.log(`   - Match Results: ${deletedMatchResults.count}`)
    console.log(`   - Match Disputes: ${deletedMatchDisputes.count}`)
    console.log(`   - Match Spectators: ${deletedMatchSpectators.count}`)
    console.log(`   - Match Posts: ${deletedMatchPosts.count}`)
    console.log(`   - Matches: ${deletedMatches.count}`)
    console.log(`   - Match Applications: ${deletedMatchApplications.count}`)
    console.log(`   - Match Requests: ${deletedMatchRequests.count}`)
    console.log(`   - Team Join Requests: ${deletedJoinRequests.count}`)
    console.log(`   - Team Invitations: ${deletedTeamInvitations.count}`)
    console.log(`   - Team Members: ${deletedTeamMembers.count}`)
    console.log(`   - Teams: ${deletedTeams.count}`)
    console.log(`   - Notifications: ${deletedNotifications.count}`)
    console.log(`   - Player Profiles: ${deletedPlayerProfiles.count}`)

  } catch (error) {
    console.error('❌ Error during cleanup:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the cleanup
clearAllTeamData()
  .then(() => {
    console.log('\n✨ Cleanup script finished')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n💥 Cleanup script failed:', error)
    process.exit(1)
  })
