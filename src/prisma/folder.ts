import type { Prisma } from '@prisma/client'
import { prisma } from '#root/prisma/index.js'

export interface FolderInput {
  userId: number
  name: string
}
// export async function createOrFindFolder(data: FolderInput) {
//   try {
//     const user = await prisma.user.findUnique({
//       where: {
//         id: data.userId,
//       },
//     })

//     if (!user) {
//       throw new Error(`User with id ${data.userId} not found`)
//     }

//     const userId = user.id

//     const folder = await prisma.$transaction(async (prisma) => {
//       let folder = await prisma.folder.findFirst({
//         where: {
//           userId,
//           name: data.name,
//         },
//       })

//       if (!folder) {
//         folder = await prisma.folder.create({
//           data: {
//             userId,
//             name: data.name,
//           },
//         })
//       }

//       return folder
//     })

//     console.log('YOOOOOOOOOOOOOOOOOOOOOOO')
//     console.log(folder)

//     return folder
//   }
//   catch (error) {
//     console.log('Error creating or finding folder:', error)
//     throw error
//   }
//   finally {
//     await prisma.$disconnect()
//   }
// }
export async function createOrFindFolder(data: FolderInput) {
  try {
    // Attempt to find the folder first
    let folder = await prisma.folder.findFirst({
      where: {
        userId: data.userId,
        name: data.name,
      },
    })

    // If the folder doesn't exist, create it
    if (!folder) {
      try {
        folder = await prisma.folder.create({
          data: {
            userId: data.userId,
            name: data.name,
          },
        })
      }
      catch (error) {
        // If there's a unique constraint error, try finding the folder again
        if ((error as Prisma.PrismaClientKnownRequestError).code === 'P2002') {
          folder = await prisma.folder.findFirst({
            where: {
              userId: data.userId,
              name: data.name,
            },
          })
        }
        else {
          throw error // Re-throw if it's not a unique constraint error
        }
      }
    }

    return folder
  }
  catch (error) {
    console.error('Error creating or finding folder:', error)
    throw error
  }
}
export async function getAllFolders(telegramId: number) {
  try {
    const user = await prisma.user.findUnique({
      where: {
        telegramId,
      },
      include: {
        folders: true,
      },
    })

    if (!user) {
      console.log('User not found')
      return null
    }

    return user.folders
  }
  catch (error) {
    console.error('Error fetching folders:', error)
    throw error
  }
  finally {
    await prisma.$disconnect()
  }
}
export async function findFolderById(id: number, folderId: number) {
  try {
    const user = await prisma.user.findUnique({
      where: {
        id,
      },
    })

    if (!user) {
      console.log('User not found')
      return null
    }

    const userId = user.id

    const folder = await prisma.folder.findFirst({
      where: {
        userId,
        id: folderId,
      },
    })

    return folder
  }
  catch (error) {
    console.error('Error fetching folders:', error)
    throw error
  }
  finally {
    await prisma.$disconnect()
  }
}
export async function findFolderByName(telegramId: number, name: string) {
  try {
    const user = await prisma.user.findUnique({
      where: {
        telegramId,
      },
    })

    if (!user) {
      console.log('User not found')
      return null
    }

    const userId = user.id

    const folder = await prisma.folder.findFirst({
      where: {
        userId,
        name,
      },
    })

    return folder
  }
  catch (error) {
    console.error('Error fetching folders:', error)
    throw error
  }
  finally {
    await prisma.$disconnect()
  }
}
