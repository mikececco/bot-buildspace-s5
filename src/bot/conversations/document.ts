import { Buffer } from 'node:buffer'
import * as cheerio from 'cheerio'
import { createConversation } from '@grammyjs/conversations'
import axios from 'axios'
import type { Conversation } from '@grammyjs/conversations'
import type { InlineDataPart } from '@google/generative-ai'
import type { Context } from '#root/bot/context.js'
import type { CreateThoughtInput } from '#root/prisma/create-thought.js'
import { editExpenseKeyboard } from '#root/bot/keyboards/index.js'
import { createContext } from '#root/bot/services/create-context-service.js'
import { findSimilarEmbeddings } from '#root/prisma/embedding.js'
import { embed } from '#root/bot/services/embed-service.js'
import { completion } from '#root/bot/services/completion-service.js'
import { handleGenerateContentRequest } from '#root/bot/services/google-ai-service.js'
import { getDocument } from '#root/bot/services/get-bookmark-service.js'
import { config } from '#root/config.js'

export const DOCUMENT_CONVERSATION = 'document'

export function documentConversation() {
  return createConversation(
    async (conversation: Conversation<Context>, ctx: Context) => {
      if (ctx.from) {
        getDocument(ctx)

        await ctx.reply('Analyzing your document, it might take a while...')
        ctx.chatAction = 'typing'
        await conversation.sleep(200)
        await ctx.reply('I will text you when I will be done')
        ctx.chatAction = 'typing'

        await conversation.sleep(1000)
        // createContext(ctx, dataSummary, generatedContent)
        await ctx.reply('Document ready your document...')

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
                  console.log(similarThoughts)
                  // const completed = await completion(similarThoughts, question)

                  // await questionCtx.reply(completed)
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
    DOCUMENT_CONVERSATION,
  )
}
