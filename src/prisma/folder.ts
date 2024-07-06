import { prisma } from '#root/prisma/index.js'

export interface FolderInput {
  userId: number
  name: string
}
export async function createOrFindFolder(data: FolderInput) {
  try {
    const user = await prisma.user.findUnique({
      where: {
        id: data.userId,
      },
    })

    if (!user) {
      throw new Error(`User with id ${data.userId} not found`)
    }

    const userId = user.id

    let folder = await prisma.folder.findFirst({
      where: {
        userId,
        name: data.name,
      },
    })

    if (!folder) {
      folder = await prisma.folder.create({
        data: {
          userId,
          name: data.name,
        },
      })
    }
    else {
      console.log(`Folder with name '${data.name}' already exists for user ${userId}`)
    }

    return folder
  }
  catch (error) {
    console.error('Error creating or finding folder:', error)
    throw error
  }
  finally {
    await prisma.$disconnect()
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
