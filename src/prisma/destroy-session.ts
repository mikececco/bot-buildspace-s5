import { prisma } from '#root/prisma/index.js'

export async function deleteSession(key: string) {
  try {
    const deletedSession = await prisma.session.delete({
      where: {
        key,
      },
    })
    console.log('Deleted session:', deletedSession)
    return deletedSession
  }
  catch (error) {
    console.error('Error deleting session:', error)
    // throw error
  }
  finally {
    await prisma.$disconnect()
  }
}
export async function deleteUser(telegramId: number) {
  try {
    const deletedUser = await prisma.user.delete({
      where: {
        telegramId,
      },
    })
    console.log('Deleted user:', deletedUser)
    return deletedUser
  }
  catch (error) {
    console.error('Error deleting user:', error)
    // throw error
  }
  finally {
    await prisma.$disconnect()
  }
}
