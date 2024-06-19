import { Buffer } from 'node:buffer'
import type { InlineDataPart } from '@google/generative-ai'
import axios from 'axios'
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
import type { CreateThoughtInput } from '#root/prisma/create-thought.js'
import { handleGenerateContentRequest } from '#root/bot/services/google-ai-service.js'
import { config } from '#root/config.js'

export const IMAGE_CONVERSATION = 'image'

export function imageConversation() {
  return createConversation(
    async (conversation: Conversation<Context>, ctx: Context) => {
      if (ctx.message && ctx.message.photo && ctx.from) {
        await ctx.reply('Analyzing your image...')
        ctx.chatAction = 'typing'

        const file = await ctx.getFile() // valid for at least 1 hour

        if (!file) {
          throw new Error('No file received from Telegram')
        }

        const downloadLink = `https://api.telegram.org/file/bot${config.BOT_TOKEN}/${file.file_path}`

        const response = await axios.get(downloadLink, {
          responseType: 'arraybuffer',
        })

        const prompt = `
        Describe the image as extensively as you can, provide a lot of details.
        `

        const imageDataPart: InlineDataPart = {
          inlineData: {
            data: Buffer.from(response.data).toString('base64'),
            mimeType: 'image/jpeg', // Set the correct mime type for your file
          },
        }
        const model = 'gemini-pro-vision' // Corrected model name
        const generatedContent = await handleGenerateContentRequest(
          config.GOOGLE_AI,
          prompt,
          imageDataPart,
          model,
        )

        const dataSummary: CreateThoughtInput = {
          telegramId: ctx.from.id, // Replace with actual Telegram user ID
          username: ctx.from.username || 'Unknown', // Replace with actual username, default to 'Unknown' if not provided
          content: generatedContent,
        }

        createContext(ctx, dataSummary, generatedContent)

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
    IMAGE_CONVERSATION,
  )
}
