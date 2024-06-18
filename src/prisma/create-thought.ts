import process from 'node:process'
import pgvector from 'pgvector'
import * as pg from 'pg'
import { prisma } from '#root/prisma/index.js'
import { embed } from '#root/bot/services/embed-service.js'

const { Pool } = pg.default

const connectionString = `${process.env.POSTGRES_URL}`

const pool = new Pool({
  connectionString,
  min: 0, // minimum number of clients in the pool
  max: 10, // maximum number of clients in the pool
})
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

    // Generate the embedding
    const embedding = await embed(data.content)

    // Convert embedding to SQL-compatible vector
    const vectorEmbedding = pgvector.toSql(embedding)

    const thought = await prisma.thought.create({
      data: {
        content: data.content,
        userId: user.id,
      },
    })

    // Update the thought with the embedding
    await pool.query(`
      UPDATE thoughts
      SET embedding = $1::vector
      WHERE id = $2
    `, [vectorEmbedding, thought.id])

    // Return the created thought
    const updatedThought = await prisma.thought.findUnique({
      where: {
        id: thought.id,
      },
    })

    return updatedThought
  }
  catch (error) {
    console.error('Error creating thought:', error)
    throw error
  }
  finally {
    await prisma.$disconnect()
  }
}

export async function findSimilarEmbeddings(telegramId: number, embedding: number[]): Promise<any[]> {
  try {
    let user = await prisma.user.findUnique({
      where: {
        telegramId,
      },
    })

    // If the user doesn't exist, create a new user
    if (!user) {
      user = await prisma.user.create({
        data: {
          telegramId,
          username: 'Unknown',
        },
      })
    }
    const vectorEmbedding = pgvector.toSql(embedding)

    const res = await pool.query(`
      SELECT id, content, embedding::text
      FROM thoughts
      WHERE "userId" = $1
      ORDER BY embedding <-> $2::vector
      LIMIT 1
    `, [user.id, vectorEmbedding])

    return res.rows
  }
  catch (error) {
    console.error('Error finding similar embeddings:', error)
    throw error
  }
}
