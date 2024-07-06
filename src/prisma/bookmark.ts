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

// export async function saveBookmarks(bookmarks: CreateBookmarkInput[]) {
//   try {
//     const bookmarksWithUserId: BookmarkWithUserId[] = []
//     for (const data of bookmarks) {
//       // Find the user by telegramId
//       let user = await prisma.user.findUnique({
//         where: {
//           telegramId: data.telegramId,
//         },
//       })

//       // If the user doesn't exist, create a new user
//       if (!user) {
//         user = await prisma.user.create({
//           data: {
//             telegramId: data.telegramId,
//             username: data.username,
//           },
//         })
//       }

//       // Prepare bookmark data with userId
//       const userId = user.id

//       const existingBookmark = await prisma.bookmark.findFirst({
//         where: {
//           userId,
//           link: data.link,
//         },
//       })
//       const { title, description } = await fetchMetadata(data.link)
//       const combinedInfo = `
//         Title: ${title}
//         \n
//         Description: ${description}
//       `

//       // const category = await categorizeWithGoogleCloud(data.link)
//       // console.log(category)

//       if (existingBookmark) {
//         console.log(`Skipping bookmark with link '${data.link}' for user ${user.id} - already exists.`)
//         continue // Skip current iteration and proceed to next bookmark
//       }
//       const folderData: FolderInput = {
//         userId,
//         name: data.name,
//       }
//       const folder = await createOrFindFolder(folderData)

//       // Prepare bookmark data with userId
//       if (folder) {
//         bookmarksWithUserId.push({
//           content: combinedInfo,
//           link: data.link,
//           folderId: folder.id,
//           name: data.name,
//           userId,
//         })
//       }
//     }

//     const result = await prisma.bookmark.createMany({
//       data: bookmarksWithUserId,
//       skipDuplicates: true, // This option skips records that violate unique constraints
//     })

//     console.log(`Successfully saved ${result.count} bookmarks`)
//     return result
//   }
//   catch (error) {
//     console.error('Error saving bookmarks:', error)
//     throw error
//   }
//   finally {
//     await prisma.$disconnect()
//   }
// }

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

// export async function getUserBookmarksFolders(telegramId: number) {
//   try {
//     const user = await prisma.user.findUnique({
//       where: { telegramId },
//     })

//     if (!user) {
//       throw new Error(`User with telegramId ${telegramId} not found`)
//     }

//     const folders = await prisma.bookmark.findMany({
//       where: { userId: user.id },
//       select: {
//         folder: true,
//       },
//       distinct: ['folder'],
//     })

//     // Extract the folder names from the resulting objects
//     const folderNames = folders.map(bookmark => bookmark.folder)

//     return folderNames
//   }
//   catch (error) {
//     console.error('Error getting user bookmarks:', error)
//     throw error
//   }
//   finally {
//     await prisma.$disconnect()
//   }
// }

export async function saveBookmarks(bookmarks: CreateBookmarkInput[]) {
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
          name: data.name,
        }
        const folder = await createOrFindFolder(folderData)

        return {
          content: combinedInfo,
          link: data.link,
          folderId: folder.id,
          name: data.name,
          userId,
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

// async function fetchMetadata(link: string): Promise<{ title: string, description: string }> {
//   // Dummy implementation for fetching metadata
//   return { title: 'Dummy Title', description: 'Dummy Description' }
// }

// async function findOrCreateFolder(userId: number, folderName: string) {
//   let folder = await prisma.folder.findFirst({
//     where: { userId, name: folderName },
//   })

//   if (!folder) {
//     folder = await prisma.folder.create({
//       data: { userId, name: folderName },
//     })
//   }

//   return folder
// }
