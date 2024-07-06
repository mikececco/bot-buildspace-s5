import { prisma } from '#root/prisma/index.js'
import { fetchMetadata } from '#root/bot/services/fetch-title-service.js'
import { categorizeWithGoogleCloud } from '#root/bot/services/categorize-service.js'
import { createOrFindFolder } from '#root/prisma/folder.js'
import type { FolderInput } from '#root/prisma/folder.js'

export interface CreateBookmarkInput {
  telegramId: number
  username: string
  content: string
  link: string
  name: string
  folderId?: number
}
export interface CreateBookmarkWithFolderInput {
  telegramId: number
  username: string
  content: string
  link: string
  name: string
  folder: string
}

interface BookmarkWithUserId {
  content: string
  link: string
  folderId: number
  name: string
  userId: number
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
      // Check if the link already exists for the user
      const existingBookmark = await prisma.bookmark.findFirst({
        where: {
          userId,
          link: data.link,
        },
      })

      if (existingBookmark) {
        throw new Error('Bookmark with this link already exists for this user.')
      }

      const folderData: FolderInput = {
        userId,
        name: data.name,
      }
      const folder = await createOrFindFolder(folderData)

      if (folder) {
        const bookmark = await prisma.bookmark.create({
          data: {
            content: data.content,
            link: data.link,
            folderId: folder.id,
            name: data.name,
            userId,
          },
        })
        return bookmark
      }
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

export async function getUserBookmarks(telegramId: number) {
  try {
    const user = await prisma.user.findUnique({
      where: { telegramId },
    })

    if (!user) {
      throw new Error(`User with telegramId ${telegramId} not found`)
    }

    const bookmarks = await prisma.bookmark.findMany({
      where: { userId: user.id },
    })

    return bookmarks
  }
  catch (error) {
    console.error('Error getting user bookmarks:', error)
    throw error
  }
  finally {
    await prisma.$disconnect()
  }
}

export async function saveBookmarks(bookmarks: CreateBookmarkWithFolderInput[]) {
  try {
    const userIds = await fetchOrCreateUsers(bookmarks)

    const bookmarksToCreate = await Promise.all(
      bookmarks.map(async (data, index) => {
        const userId = userIds[index]
        const existingBookmark = await prisma.bookmark.findFirst({
          where: { userId, link: data.link },
        })

        if (existingBookmark) {
          console.log(`Skipping bookmark with link '${data.link}' for user ${userId} - already exists.`)
          return null
        }

        const { title, description } = await fetchMetadata(data.link)
        const combinedInfo = `Title: ${title}\nDescription: ${description}`

        const folderData: FolderInput = {
          userId,
          name: data.folder,
        }
        const folder = await createOrFindFolder(folderData)

        if (folder) {
          return {
            content: combinedInfo,
            link: data.link,
            folderId: folder.id,
            name: data.name || title,
            userId,
          }
        }
      }),
    )

    const validBookmarks = bookmarksToCreate.filter(Boolean)

    if (validBookmarks.length > 0) {
      const result = await prisma.bookmark.createMany({
        data: validBookmarks as BookmarkWithUserId[],
        skipDuplicates: true,
      })

      console.log(`Successfully saved ${result.count} bookmarks`)
      return result
    }
    else {
      console.log('All bookmarks already exist, nothing new saved.')
      return { count: 0 }
    }
  }
  catch (error) {
    console.error('Error saving bookmarks:', error)
    throw error
  }
  finally {
    await prisma.$disconnect()
  }
}

async function fetchOrCreateUsers(bookmarks: CreateBookmarkInput[]): Promise<number[]> {
  const userIds: number[] = []

  for (const data of bookmarks) {
    let user = await prisma.user.findUnique({
      where: { telegramId: data.telegramId },
    })

    if (!user) {
      user = await prisma.user.create({
        data: {
          telegramId: data.telegramId,
          username: data.username,
        },
      })
    }

    userIds.push(user.id)
  }

  return userIds
}
