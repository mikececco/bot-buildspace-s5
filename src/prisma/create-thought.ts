import { prisma } from '#root/prisma/index.js'

export interface CreateThoughtInput {
  telegramId: number
  username: string
  content: string
}

export async function createThought(data: CreateThoughtInput) {
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

    // Create a new thought associated with the user
    const thought = await prisma.thought.create({
      data: {
        content: data.content,
        userId: user.id,
      },
    })

    // Return the created thought
    return thought
  }
  catch (error) {
    console.error('Error creating thought:', error)
    throw error
  }
  finally {
    await prisma.$disconnect()
  }
}
