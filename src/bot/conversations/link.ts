import type { Conversation } from '@grammyjs/conversations'
import { createConversation } from '@grammyjs/conversations'
import type { Context } from '#root/bot/context.js'
import {
  editExpenseKeyboard,
} from '#root/bot/keyboards/index.js'
import { createContext } from '#root/bot/services/create-context-service.js'
import { findSimilarEmbeddings } from '#root/prisma/embedding.js'
import { embed } from '#root/bot/services/embed-service.js'
import { completion } from '#root/bot/services/completion-service.js'

export const LINK_CONVERSATION = 'link'

export function linkConversation() {
  return createConversation(
    async (conversation: Conversation<Context>, ctx: Context) => {
      if (ctx.message && ctx.message.text && ctx.from) {
        const text = ctx.message.text.toLowerCase()
        console.log('HEREEEE IS THE CONTEXT')
        console.log(text)

        if (text.includes('spotify') || text.includes('youtube')) {
          // Add your logic for handling Spotify or YouTube links
          await ctx.reply('Detected Spotify or YouTube link.')
          return await ctx.reply('Feature to extrapolate content coming soon!')
        }

        createContext(ctx)

        ctx.reply('Analizing your link...')
        ctx.chatAction = 'typing'

        await ctx.reply('Choose your action', {
          reply_markup: editExpenseKeyboard,
        })

        let shouldExit = false

        while (!shouldExit) {
          ctx = await conversation.wait()

          if (ctx.has('message:text')) {
            switch (ctx.message.text) {
              case 'Ask 🎙️': {
                ctx.chatAction = 'typing'
                await conversation.sleep(200)
                await ctx.reply('Ask your question through voice or text.', {
                  reply_markup: { remove_keyboard: true },
                })

                const questionCtx = await conversation.wait()
                if (questionCtx.has('message:text')) {
                  const question = questionCtx.message.text
                  const embedding = await embed(question)
                  const similarThoughts = await findSimilarEmbeddings(ctx.from.id, embedding)

                  const completed = await completion(similarThoughts, question)

                  await ctx.reply(completed)
                }
                shouldExit = true
                return shouldExit
              }
              case 'Just add ➕': {
                await ctx.reply('Added')
                shouldExit = true
                return shouldExit
              }
              case 'Cancel ❌': {
                await ctx.reply('Cancelled all actions.', {
                  reply_markup: { remove_keyboard: true },
                })
                shouldExit = true
                return shouldExit
              }
              default: {
                await ctx.reply('Unknown command.')
                shouldExit = false
                return shouldExit
              }
            }
          }
          else if (ctx.hasCommand('cancel')) {
            ctx.chatAction = 'typing'

            await ctx.reply(`Hello`)
            shouldExit = true
          }
          else {
            await ctx.reply('Choose your action', {
              reply_markup: editExpenseKeyboard,
            })
            shouldExit = false
          }
        }
      }
    },
    LINK_CONVERSATION,
  )
}
