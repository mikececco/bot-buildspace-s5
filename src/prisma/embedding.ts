import process from 'node:process'
import pgvector from 'pgvector'
import * as pg from 'pg'
import { prisma } from '#root/prisma/index.js'

const { Pool } = pg.default

const connectionString = `${process.env.POSTGRES_URL}`

const pool = new Pool({
  connectionString,
  min: 0, // minimum number of clients in the pool
  max: 10, // maximum number of clients in the pool
})

export async function saveEmbedding(telegramId: number, username: string, content: string, embedding: number[], thoughtId: number) {
  const vectorEmbedding = pgvector.toSql(embedding)
  console.log('GONNA INSERT TO EMBEDDINGSS')

  try {
    // Find the user by telegramId
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
          username,
        },
      })
    }

    const thought = await prisma.embedding.create({
      data: {
        content,
        thoughtId,
        userId: user.id,
      },
    })

    // Update the thought with the embedding
    await pool.query(`
      UPDATE embeddings
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

export async function findSimilarEmbeddings(telegramId: number, embedding: number[]): Promise<string> {
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
      FROM embeddings
      WHERE "userId" = $1
      ORDER BY embedding <-> $2::vector
      LIMIT 1
    `, [user.id, vectorEmbedding])

    // Return the single row if it exists, otherwise return null
    const closestEmbedding = res.rows.length > 0 ? res.rows[0] : null

    if (closestEmbedding) {
      const content = closestEmbedding.content
      return content
    }
    else {
      console.log('No embedding found for the given user.')
      return vectorEmbedding
    }
  }
  catch (error) {
    console.error('Error finding similar embeddings:', error)
    throw error
  }
}
