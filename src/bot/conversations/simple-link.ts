import type { Conversation } from '@grammyjs/conversations'
import { createConversation } from '@grammyjs/conversations'
import { Keyboard } from 'grammy'
import type { Context } from '#root/bot/context.js'
import { saveBookmark } from '#root/prisma/bookmark.js'
import { createOrFindFolder, findFolderByName, getAllFolders } from '#root/prisma/folder.js'
import type { CreateBookmarkInputFolder } from '#root/prisma/bookmark.js'
import type { FolderInput } from '#root/prisma/folder.js'
import { createOrFindUser } from '#root/prisma/create-user.js'
import { getLinkContent } from '#root/bot/services/get-link-content-service.js'
import { descriptionKeyboard } from '#root/bot/keyboards/index.js'
import { categorizeWithGoogleCloud } from '#root/bot/services/categorize-service.js'

export const SIMPLE_LINK_CONVERSATION = 'simple_link'

export function simpleLinkConversation() {
  return createConversation(
    async (conversation: Conversation<Context>, ctx: Context) => {
      try {
        if (ctx.message && ctx.message.text && ctx.from) {
          await ctx.reply('Analyzing your link...')
          ctx.chatAction = 'typing'

          const link = ctx.message.text.toLowerCase()

          if (link.includes('spotify') || link.includes('youtube') || link.includes('instagram')) {
            await ctx.reply('Detected Spotify or YouTube link.')
            return await ctx.reply('Feature to extrapolate content coming soon!')
          }

          let shouldExit = false

          while (!shouldExit) {
            await ctx.reply('Give it a name.')
            const nameCtx = await conversation.wait()

            if (nameCtx.has('message:text')) {
              await nameCtx.reply('Got it!')
              const bookmarkName = nameCtx.message.text

              await nameCtx.reply('Manually describe or generate bookmark description.', {
                reply_markup: descriptionKeyboard,
              })

              const descriptionCtx = await conversation.wait()

              if (descriptionCtx.has('message:text')) {
                if (descriptionCtx.message.text === 'Describe') {
                  await descriptionCtx.reply('Describe your link.', {
                    reply_markup: { remove_keyboard: true },
                  })
                  const descriptionInputCtx = await conversation.wait()

                  await descriptionInputCtx.reply('Got it!', {
                    reply_markup: { remove_keyboard: true },
                  })
                  shouldExit = await folderSelect(conversation, descriptionInputCtx, link, bookmarkName)
                }
                else {
                  await descriptionCtx.reply('Autogenerating...', {
                    reply_markup: { remove_keyboard: true },
                  })
                  shouldExit = await folderSelect(conversation, descriptionCtx, link, bookmarkName)
                }
              }
              else {
                await descriptionCtx.reply('Not valid.')
                shouldExit = true
              }
            }
            else if (nameCtx.hasCommand('cancel')) {
              await nameCtx.reply('Cancelled.')
              shouldExit = true
            }
            else {
              await nameCtx.reply('Invalid input. Type bookmark name.')
              shouldExit = false
            }
          }
        }
      }
      catch (error) {
        console.error('Error in simpleLinkConversation:', error)
        await ctx.reply('An unexpected error occurred.')
      }
    },
    SIMPLE_LINK_CONVERSATION,
  )
}

async function folderSelect(
  conversation: Conversation<Context>,
  ctx: Context,
  link: string,
  bookmarkName: string,
): Promise<boolean> {
  if (ctx && ctx.from) {
    // Fetch user folders
    const folders = await getAllFolders(ctx.from.id)
    const keyboard = new Keyboard()

    if (folders) {
      folders.forEach((folder) => {
        keyboard.text(folder.name).row()
      })
    }
    keyboard.text('Create folder').row()
    await ctx.reply('Select folder', {
      reply_markup: keyboard,
    })

    const folderCtx = await conversation.wait()

    if (folderCtx.has('message:text')) {
      if (folderCtx.message.text === 'Create folder') {
        folderCtx.chatAction = 'typing'
        await folderCtx.reply('Folder name?', {
          reply_markup: { remove_keyboard: true },
        })
        const folderNameCtx = await conversation.wait()
        if (folderNameCtx.has('message:text')) {
          folderNameCtx.chatAction = 'typing'
          const folderName = folderNameCtx.message.text

          const user = await createOrFindUser({
            telegramId: ctx.from.id,
            username: ctx.from.username ?? 'Unknown', // Use optional chaining and provide a default value
          })

          const folderData: FolderInput = {
            userId: user.id,
            name: folderName,
          }

          const folder = await createOrFindFolder(folderData)

          if (folder) {
            try {
              addTagsAndLinkContent(link, bookmarkName, folder.id, folderNameCtx)
              await folderNameCtx.reply(`Bookmark ${bookmarkName} with link ${link} saved successfully in folder: ${folderName}`, {
                reply_markup: { remove_keyboard: true },
              })
            }
            catch (error) {
              console.error('Error saving bookmark:', error)
              await folderCtx.reply('Bookmark exists already, use search function to find it!')
            }
            return true
          }
        }
      }
      else {
        const folderText = folderCtx.message.text

        const folderSelected = await findFolderByName(ctx.from.id, folderText)

        // Create your input object
        if (folderSelected) {
          try {
            addTagsAndLinkContent(link, bookmarkName, folderSelected.id, folderCtx)
            await folderCtx.reply(`Bookmark ${bookmarkName} with link ${link} saved successfully in folder: ${folderSelected.name}`, {
              reply_markup: { remove_keyboard: true },
            })
          }
          catch (error) {
            console.error('Error saving bookmark:', error)
            await folderCtx.reply('Failed to save bookmark. Please try again.')
          }
          return true
        }
      }
    }
    else if (folderCtx.hasCommand('cancel')) {
      await folderCtx.reply('Cancelled.')
      return true
    }
    else {
      await folderCtx.reply('Invalid input. Please select a folder.')
    }
  }
  return false
}

function addTagsAndLinkContent(
  link: string,
  bookmarkName: string,
  folderId: number,
  ctx: Context,
): Promise<void> {
  let linkContent: string // Variable to hold link content

  // Fetch content for the link
  return getLinkContent(link)
    .then((content) => {
      linkContent = content // Store link content for later use
      // Categorize content with Google Cloud
      return categorizeWithGoogleCloud(content)
        .then((tags) => {
          // Prepare input for saving bookmark
          const input: CreateBookmarkInputFolder = {
            telegramId: ctx.message?.chat.id ?? 0, // Replace with actual telegramId extraction logic
            username: ctx.message?.from.username ?? '', // Replace with actual username extraction logic
            content: linkContent, // Replace with actual content
            link, // Replace with actual link
            folderId, // Assign the selected folder here
            name: bookmarkName, // Replace with actual name
            tags,
          }

          // Save bookmark
          return saveBookmark(input)
            .then(() => {
              console.log(`Bookmark ${bookmarkName} saved successfully.`)
            })
            .catch((error) => {
              console.error('Error saving bookmark:', error)
              throw error // Propagate the error if necessary
            })
        })
        .catch((error) => {
          console.error('Error categorizing content:', error)
          throw error // Propagate the error if necessary
        })
    })
    .catch((error) => {
      console.error('Error fetching content:', error)
      throw error // Propagate the error if necessary
    })
    .finally(() => {
      console.log('Content fetching and saving completed.')
    })
}
