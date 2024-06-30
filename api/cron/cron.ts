import type { VercelRequest, VercelResponse } from '@vercel/node'
import { PrismaClient } from '@prisma/client'
import { bot } from '#root/main.js'

const prisma = new PrismaClient()

export async function GET(req: VercelRequest, res: VercelResponse) {
  try {
    // Fetch all users
    const users = await prisma.user.findMany({
      include: { bookmarks: true },
    })

    // Array to store results for each user
    const results = []

    // Process each user
    for (const user of users) {
      // Calculate the number of days since the user was created
      const currentDate = new Date()
      const userCreationDate = new Date(user.createdAt)
      const dayNumber = Math.floor((currentDate.getTime() - userCreationDate.getTime()) / (1000 * 60 * 60 * 24))

      // Determine the start index for bookmarks
      const startIndex = (dayNumber * 3) % user.bookmarks.length

      // Fetch three bookmarks
      const bookmarks = user.bookmarks.slice(startIndex, startIndex + 3)

      // If there are not enough bookmarks at the end, wrap around to the beginning
      if (bookmarks.length < 3) {
        bookmarks.push(...user.bookmarks.slice(0, 3 - bookmarks.length))
      }

      // Prepare messages for each bookmark
      const messages = bookmarks.map((bookmark, index) => {
        const markdownMessage = `**Bookmark ${index + 1}:** [${bookmark.link}](${bookmark.link}) - ${bookmark.folder}`
        return markdownMessage
      })

      // Send messages to the user
      for (const message of messages) {
        await bot.api.sendMessage(user.id, message)
      }

      // Add bookmarks to results
      results.push({ userId: user.id, bookmarks })
    }

    // Send results
    res.status(200).json({ message: 'Cron job executed successfully', results })
  }
  catch (error) {
    console.error('An error occurred during cron execution:', error)
    res.status(500).json({ error: 'An error occurred during cron execution' })
  }
  finally {
    await prisma.$disconnect()
  }
}
