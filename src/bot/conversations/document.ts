import { createConversation } from '@grammyjs/conversations'
import type { Conversation } from '@grammyjs/conversations'
import type { Context } from '#root/bot/context.js'
import { editExpenseKeyboard } from '#root/bot/keyboards/index.js'
import { findSimilarEmbeddings } from '#root/prisma/embedding.js'
import { embed } from '#root/bot/services/embed-service.js'
import { completion } from '#root/bot/services/completion-service.js'
import { getDocument } from '#root/bot/services/get-bookmark-service.js'

export const DOCUMENT_CONVERSATION = 'document'

export function documentConversation() {
  return createConversation(
    async (conversation: Conversation<Context>, ctx: Context) => {
      if (ctx.from) {
        const count = await getDocument(ctx)

        // await ctx.reply('Analyzing your document, it might take a while...')
        ctx.chatAction = 'typing'

        await ctx.reply(`${count} bookmarks counted.`)
        // createContext(ctx, dataSummary, generatedContent)

        let shouldExit = false

        while (!shouldExit) {
          await ctx.reply('Choose your action', {
            reply_markup: editExpenseKeyboard,
          })
          const ctxFirst = await conversation.wait()

          if (ctxFirst.has('message:text')) {
            switch (ctxFirst.message.text) {
              case 'Ask 🎙️': {
                ctx.chatAction = 'typing'
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
                  await questionCtx.reply(`${similarThoughts}`)
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
              case 'Organize 📍': {
                ctxFirst.chatAction = 'typing'
                const message = `*Tell us how you want to organize your bookmarks either through voice or text.*
                  1. \`Just re-organize my bookmarks\`
                  2. \`Re-organize my bookmarks based on the following categories AI, Personal finance, videos and tools\`
                  3. \`Re-organize my bookmarks based on AI, Personal finance, videos and tools\`
                  `
                await ctx.reply(message, {
                  parse_mode: 'Markdown',
                  reply_markup: { remove_keyboard: true },
                })

                const questionCtx = await conversation.wait()
                if (questionCtx.has('message:text')) {
                  // questionCtx.chatAction = 'typing'
                  // const question = questionCtx.message.text
                  // const embedding = await embed(question)
                  // const similarThoughts = await findSimilarEmbeddings(questionCtx, embedding)
                  // const completed = await completion(similarThoughts, question)
                  // await questionCtx.reply(completed)
                  // await questionCtx.reply(`${similarThoughts}`)
                  await questionCtx.reply('Helo')
                }
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
    DOCUMENT_CONVERSATION,
  )
}
