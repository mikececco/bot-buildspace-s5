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
    throw error
  }
  finally {
    await prisma.$disconnect()
  }
}
