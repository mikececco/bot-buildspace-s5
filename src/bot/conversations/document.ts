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
import { getDocument } from '#root/bot/services/get-document-service.js'
import { config } from '#root/config.js'

export const DOCUMENT_CONVERSATION = 'document'

export function documentConversation() {
  return createConversation(
    async (conversation: Conversation<Context>, ctx: Context) => {
      if (ctx.from) {
        await ctx.reply('Analyzing your document...')
        ctx.chatAction = 'typing'
        // getDocument(ctx)
        // const prompt = `
        // Extract the following bookmark export file as the following JSON object:
        // ${bookmarksJson}
        // `

        // const imageDataPart: InlineDataPart = {
        //   inlineData: {
        //     data: Buffer.from(response.data).toString('base64'),
        //     mimeType: 'text/html', // Set the correct mime type for your file
        //   },
        // }
        // const model = 'gemini-pro-vision' // Corrected model name
        // const generatedContent = await handleGenerateContentRequest(
        //   config.GOOGLE_AI,
        //   prompt,
        //   imageDataPart,
        //   model,
        // )

        // const dataSummary: CreateThoughtInput = {
        //   telegramId: ctx.from.id,
        //   username: ctx.from.username || 'Unknown',
        //   content: generatedContent,
        // }

        // createContext(ctx, dataSummary, generatedContent)

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
    DOCUMENT_CONVERSATION,
  )
}
