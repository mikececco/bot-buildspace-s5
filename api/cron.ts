import type { VercelRequest, VercelResponse } from '@vercel/node'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const id = 123 // Replace with the actual ID you want to fetch

    if (!id) {
      res.status(400).json({ error: 'Bookmark ID is required' })
      return
    }

    const bookmark = await prisma.bookmark.findUnique({
      where: { id: Number(id) },
    })

    if (!bookmark) {
      res.status(404).json({ error: 'Bookmark not found' })
      return
    }

    res.status(200).json(bookmark)
  }
  catch (error) {
    res.status(500).json({ error: 'An error occurred while fetching the bookmark' })
  }
  finally {
    await prisma.$disconnect()
  }
}
