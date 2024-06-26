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

export interface CreateEmbeddingInput {
  content: string
  embedding?: any // Adjust type based on your vector implementation
  telegramId: number
  username: string
  thoughtId?: number
  bookmarkId?: number
}

export async function saveEmbedding(data: CreateEmbeddingInput) {
  const vectorEmbedding = pgvector.toSql(data.embedding)
  console.log('GONNA INSERT TO EMBEDDINGSS')

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
          username: data.username || 'username',
        },
      })
    }

    const embedding = await prisma.embedding.create({
      data: {
        content: data.content,
        userId: user.id,
        thoughtId: data.thoughtId ?? null,
        bookmarkId: data.bookmarkId ?? null,
      },
    })

    // Update the thought with the embedding
    await pool.query(`
      UPDATE embeddings
      SET embedding = $1::vector
      WHERE id = $2
    `, [vectorEmbedding, embedding.id])
  }
  catch (error) {
    console.error('Error creating thought:', error)
    throw error
  }
  finally {
    await prisma.$disconnect()
  }
}
// interface EmbeddingInfo {
//   content: string
//   thoughtId: number // Assuming thought is a string field in your Thought model
// }

interface EmbeddingsMap {
  [embeddingId: number]: {
    content: string
    thoughtId?: number
    bookmarkId?: number
    // Add other properties as needed
  }
}

export async function findSimilarEmbeddings(ctx: any, embedding: number[]) {
  const telegramId = ctx.from.id
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
      SELECT id, content, "thoughtId", "bookmarkId"
      FROM embeddings
      WHERE "userId" = $1
      ORDER BY embedding <-> $2::vector
      LIMIT 3
    `, [user.id, vectorEmbedding])

    const embeddingsMap: EmbeddingsMap = {}

    // Iterate through the rows returned by the query
    for (let i = 0; i < res.rows.length; i++) {
      const embedding = res.rows[i]
      const embeddingId = embedding.id
      const content = embedding.content
      let thoughtId = embedding.thoughtId
      const bookmarkId = embedding.bookmarkId

      // Determine whether to use thoughtId or bookmarkId
      if (thoughtId !== null && thoughtId !== undefined) {
        console.log(`Thought ID: ${thoughtId}`)
      }
      else if (bookmarkId !== null && bookmarkId !== undefined) {
        console.log(`Bookmark ID: ${bookmarkId}`)
        thoughtId = null // Ensure thoughtId is null if using bookmarkId
      }
      else {
        console.log('No valid Thought ID or Bookmark ID found.')
        continue // Skip this iteration if neither thoughtId nor bookmarkId is present
      }

      // Build the structure of embeddingsMap
      embeddingsMap[embeddingId] = {
        content,
        thoughtId,
        bookmarkId,
      }
    }
    if (embeddingsMap) {
      // return formatObject(embeddingsMap, ctx)
      return embeddingsMap
    }
    else {
      console.log('No embedding found for the given user.')
      return embeddingsMap
    }
  }
  catch (error) {
    console.error('Error finding similar embeddings:', error)
    throw error
  }
}

export async function formatObject(object: EmbeddingsMap, ctx: any) {
  for (const embeddingId in object) {
    if (Object.prototype.hasOwnProperty.call(object, embeddingId)) {
      const entry = object[Number.parseInt(embeddingId)] // Access each entry in similarThoughts

      // Access properties of each entry
      const content = entry.content
      const thoughtId = entry.thoughtId

      // Process each entry as needed
      console.log(`Embedding ID: ${embeddingId}, Content: ${content}, Thought ID: ${thoughtId}`)

      // Reply to ctx with the extracted data
      await ctx.reply(`Embedding ID: ${embeddingId}, Content: ${content}, Thought ID: ${thoughtId}`)
    }
  }
}
