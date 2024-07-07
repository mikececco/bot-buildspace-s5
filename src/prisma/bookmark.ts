import { prisma } from '#root/prisma/index.js'
import { fetchMetadata } from '#root/bot/services/fetch-title-service.js'
// import { categorizeWithGoogleCloud } from '#root/bot/services/categorize-service.js'
import { findFolderById } from '#root/prisma/folder.js'
import type { FolderInput } from '#root/prisma/folder.js'

export interface CreateBookmarkInput {
  telegramId: number
  username: string
  content: string
  link: string
  name: string
  folder: string
}
export interface CreateBookmarkInputFolder {
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

export async function saveBookmark(data: CreateBookmarkInputFolder) {
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

      // const folderData: FolderInput = {
      //   userId,
      //   name: data.name,
      // }
      if (data.folderId) {
        const folder = await findFolderById(userId, data.folderId)

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
    // throw error
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
    // throw error
  }
  finally {
    await prisma.$disconnect()
  }
}

export async function saveBookmarks(bookmarks: CreateBookmarkInput[]) {
  try {
    const bookmarksWithUserId: BookmarkWithUserId[] = []
    const { telegramId, username } = bookmarks[0] // assuming all bookmarks have the same telegramId and username

    // Find the user by telegramId
    let user = await prisma.user.findUnique({
      where: { telegramId },
    })

    // If the user doesn't exist, create a new user
    if (!user) {
      user = await prisma.user.create({
        data: { telegramId, username },
      })
    }

    const userId = user.id // Ensure userId is a number

    // Fetch existing folders for the user
    const existingFolders = await prisma.folder.findMany({
      where: {
        userId,
      },
    })

    // Create a map to store folder names and IDs for quick lookup
    const folderMap = new Map<string, number>()
    existingFolders.forEach((folder) => {
      folderMap.set(folder.name.toLowerCase(), folder.id)
    })

    for (const data of bookmarks) {
      let folderId: number | undefined = folderMap.get(data.folder.toLowerCase())
      // If folderId is not found in the map, attempt to create the folder
      if (!folderId) {
        try {
          const newFolder = await prisma.folder.create({
            data: {
              userId,
              name: data.folder,
            },
          })
          folderId = newFolder.id
          folderMap.set(data.folder.toLowerCase(), folderId) // Update the map with newly created folderId
        }
        catch (error) {
          if (error) {
            // Unique constraint failed, folder already exists
            const existingFolder = await prisma.folder.findFirst({
              where: {
                userId,
                name: {
                  equals: data.folder, // Case-insensitive search
                  mode: 'insensitive', // Ensure case insensitivity
                },
              },
            })
            if (existingFolder) {
              folderId = existingFolder.id
              folderMap.set(data.folder.toLowerCase(), folderId) // Update the map with existing folderId
            }
          }
          else {
            throw error
          }
        }
      }

      if (!folderId) {
        throw new Error(`Folder ID for folder '${data.folder}' was not found or could not be created.`)
      }

      const existingBookmark = await prisma.bookmark.findFirst({
        where: {
          userId,
          link: data.link,
        },
      })

      if (existingBookmark) {
        console.log(`Skipping bookmark with link '${data.link}' for user ${userId} - already exists.`)
        continue // Skip current iteration and proceed to next bookmark
      }

      // Prepare bookmark data with userId and folderId
      bookmarksWithUserId.push({
        content: data.content,
        link: data.link,
        folderId,
        name: data.name,
        userId,
      })
    }

    const result = await prisma.bookmark.createMany({
      data: bookmarksWithUserId,
      skipDuplicates: true, // This option skips records that violate unique constraints
    })

    console.log(`Successfully saved ${result.count} bookmarks`)
    return result
  }
  catch (error) {
    console.error('Error saving bookmarks:', error)
    throw error
  }
  finally {
    await prisma.$disconnect()
  }
}
