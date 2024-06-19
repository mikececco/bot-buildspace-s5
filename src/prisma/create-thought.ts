import { prisma } from '#root/prisma/index.js'

// Register pgvector type

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

    // // Generate the embedding
    // const embedding = await embed(data.content)

    // // Convert embedding to SQL-compatible vector
    // const vectorEmbedding = pgvector.toSql(embedding)

    const thought = await prisma.thought.create({
      data: {
        content: data.content,
        userId: user.id,
      },
    })

    // // Update the thought with the embedding
    // await pool.query(`
    //   UPDATE thoughts
    //   SET embedding = $1::vector
    //   WHERE id = $2
    // `, [vectorEmbedding, thought.id])

    // // Return the created thought
    // const updatedThought = await prisma.thought.findUnique({
    //   where: {
    //     id: thought.id,
    //   },
    // })

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
