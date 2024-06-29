import type { VercelRequest, VercelResponse } from '@vercel/node'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Assume we are handling one user for simplicity, you can extend this logic for multiple users
    const userId = 1 // Replace with dynamic user ID if necessary

    // Fetch the user
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { bookmarks: true },
    })

    if (!user) {
      res.status(404).json({ error: 'User not found' })
      return
    }

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

    // Logic to send bookmarks to the user
    // For the sake of example, we'll just log them
    console.log('Sending bookmarks to user:', bookmarks)

    res.status(200).json({ message: 'Cron job executed successfully', bookmarks })
  }
  catch (error) {
    res.status(500).json({ error: 'An error occurred during cron execution' })
  }
  finally {
    await prisma.$disconnect()
  }
}
