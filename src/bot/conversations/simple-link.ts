import type { Conversation } from '@grammyjs/conversations'
import { createConversation } from '@grammyjs/conversations'
import { Keyboard } from 'grammy'
import type { Context } from '#root/bot/context.js'
import { saveBookmark } from '#root/prisma/bookmark.js'
import { findFolderByName, getAllFolders } from '#root/prisma/folder.js'
import type { CreateBookmarkInputFolder } from '#root/prisma/bookmark.js'

export const SIMPLE_LINK_CONVERSATION = 'simple_link'

export function simpleLinkConversation() {
  return createConversation(
    async (conversation: Conversation<Context>, ctx: Context) => {
      try {
        if (ctx.message && ctx.message.text && ctx.from) {
          await ctx.reply('Analyzing your link...')
          ctx.chatAction = 'typing'

          const text = ctx.message.text.toLowerCase()

          if (text.includes('spotify') || text.includes('youtube')) {
            await ctx.reply('Detected Spotify or YouTube link.')
            return await ctx.reply('Feature to extrapolate content coming soon!')
          }

          let shouldExit = false

          while (!shouldExit) {
            await ctx.reply('Type bookmark name')
            const nameCtx = await conversation.wait()

            if (nameCtx.has('message:text')) {
              await nameCtx.reply('Got it!')

              // Fetch user folders
              const folders = await getAllFolders(nameCtx.from.id)
              const keyboard = new Keyboard()

              if (folders) {
                if (folders.length === 0) {
                  await nameCtx.reply('You have no folders to save your bookmark.')
                  shouldExit = true
                  return
                }

                folders.forEach((folder) => {
                  keyboard.text(folder.name).row()
                })
              }
              // Send a message with the inline keyboard
              await nameCtx.reply('Select folder', {
                reply_markup: keyboard,
              })

              const folderCtx = await conversation.wait()

              if (folderCtx.has('message:text')) {
                const folderText = folderCtx.message.text

                const folderSelected = await findFolderByName(ctx.from.id, folderText)

                // Create your input object
                if (folderSelected) {
                  const input: CreateBookmarkInputFolder = {
                    telegramId: folderCtx.message?.chat.id ?? 0, // Replace with actual telegramId extraction logic
                    username: folderCtx.message?.from.username ?? '', // Replace with actual username extraction logic
                    content: '', // Replace with actual content
                    link: text, // Replace with actual link
                    folderId: folderSelected.id, // Assign the selected folder here
                    name: nameCtx.message.text, // Replace with actual name
                  }
                  try {
                    const bookmark = await saveBookmark(input)
                    await folderCtx.reply(`Bookmark saved successfully in folder: ${folderSelected}`, {
                      reply_markup: { remove_keyboard: true },
                    })
                    await folderCtx.reply(`Bookmark details: ${JSON.stringify(bookmark)}`)
                  }
                  catch (error) {
                    console.error('Error saving bookmark:', error)
                    await folderCtx.reply('Failed to save bookmark. Please try again.')
                  }
                  shouldExit = true
                }
              }
              else if (folderCtx.hasCommand('cancel')) {
                await folderCtx.reply('Cancelled.')
                shouldExit = true
              }
              else {
                await folderCtx.reply('Invalid input. Please select a folder.')
              }
            }
            else if (nameCtx.hasCommand('cancel')) {
              await nameCtx.reply('Cancelled.')
              shouldExit = true
            }
            else {
              await nameCtx.reply('Invalid input. Type bookmark name.')
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
