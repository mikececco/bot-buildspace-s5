import { endOfDay, startOfDay } from 'date-fns' // Import date-fns functions for date manipulation
import { prisma } from '#root/prisma/index.js'

export interface GetThoughtsInput {
  telegramId: number // Assuming this is the Telegram user ID
  username: string
  date: Date
}

export async function getThoughtsOfDay(data: GetThoughtsInput) {
  try {
    // Find the user by telegramId
    let user = await prisma.user.findUnique({
      where: {
        telegramId: data.telegramId,
      },
    })

    // If the user doesn't exist, create a new user
    if (!user) {
      user = await prisma.user.create({
        data: {
          telegramId: data.telegramId,
          username: data.username,
        },
      })
    }

    // Define start and end of the day for the provided date
    const startDate = startOfDay(data.date)
    const endDate = endOfDay(data.date)

    // Find all thoughts of the day for the user
    const thoughts = await prisma.thought.findMany({
      where: {
        userId: user.id,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: {
        createdAt: 'asc', // or 'desc' as per your requirement
      },
    })

    return thoughts
  }
  catch (error) {
    console.error('Error fetching thoughts of the day:', error)
    throw error
  }
  finally {
    await prisma.$disconnect()
  }
}
