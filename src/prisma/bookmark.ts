import { prisma } from '#root/prisma/index.js'

export interface CreateBookmarkInput {
  telegramId: number
  username: string
  list: string
  link: string
}

export async function saveBookmark(data: CreateBookmarkInput) {
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

    const userId = user.id

    // Save the bookmark
    try {
      const bookmark = await prisma.bookmark.create({
        data: {
          list: data.list,
          link: data.link,
          userId,
        },
      })
      return bookmark
    }
    catch (error) {
      // if (error.code === 'P2002') {
      if (error) {
        // Handle unique constraint violation (e.g., link already exists)
        console.log(`Link already exists: ${data.link}`)
      }
      else {
        console.error('Error saving bookmark:', error)
      }
    }
  }
  catch (error) {
    console.error('Error creating bookmark:', error)
    throw error
  }
  finally {
    await prisma.$disconnect()
  }
}
