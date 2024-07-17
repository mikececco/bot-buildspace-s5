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
        await ctx.reply('Analyzing your link...')
        ctx.chatAction = 'typing'

        const text = ctx.message.text.toLowerCase()

        if (text.includes('spotify') || text.includes('youtube')) {
          // Logic for handling Spotify or YouTube links
          await ctx.reply('Detected Spotify or YouTube link.')
          return await ctx.reply('Feature to extrapolate content coming soon!')
        }

        // createContext(ctx)

        let shouldExit = false

        while (!shouldExit) {
          await ctx.reply('Choose your action', {
            reply_markup: editExpenseKeyboard,
          })
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
                  questionCtx.chatAction = 'typing'
                  const question = questionCtx.message.text
                  const embedding = await embed(question)
                  const similarThoughts = await findSimilarEmbeddings(questionCtx, embedding)

                  const completed = await completion(similarThoughts, question)

                  await questionCtx.reply(completed)
                }
                shouldExit = true
                break
              }
              case 'Just add ➕': {
                await ctx.reply('Added', {
                  reply_markup: { remove_keyboard: true },
                })
                shouldExit = true
                break
              }
              case 'Cancel ❌': {
                await ctx.reply('Cancelled all actions.', {
                  reply_markup: { remove_keyboard: true },
                })
                shouldExit = true
                break
              }
              default: {
                await ctx.reply('Unknown command.')
                break
              }
            }
            if (shouldExit) {
              break
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
          }
        }
      }
    },
    LINK_CONVERSATION,
  )
}
