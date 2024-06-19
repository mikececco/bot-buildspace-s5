import { Buffer } from 'node:buffer'
import type { InlineDataPart } from '@google/generative-ai'
import { Composer } from 'grammy'
import { SpeechClient } from '@google-cloud/speech'
import type { protos } from '@google-cloud/speech'
import axios from 'axios'
import type { Voice } from '@grammyjs/types'
import { config } from '#root/config.js'
import { uploadFileToGCS } from '#root/bot/services/upload-gc-bucket-service.js'
import { getTranscript } from '#root/bot/services/get-transcript-service.js'
import type { Context } from '#root/bot/context.js'
import { logHandle } from '#root/bot/helpers/logging.js'
import { createOrFindUser } from '#root/prisma/create-user.js'
import { createThought } from '#root/prisma/create-thought.js'
import { findSimilarEmbeddings } from '#root/prisma/embedding.js'
import type { CreateThoughtInput } from '#root/prisma/create-thought.js'
import { handleGenerateContentRequest } from '#root/bot/services/google-ai-service.js'
import { LINK_CONVERSATION } from '#root/bot/conversations/index.js'

type IRecognitionConfig = protos.google.cloud.speech.v1.IRecognitionConfig

const composer = new Composer<Context>()

const feature = composer.chatType('private')

// Creates a client
const client = new SpeechClient()

feature.on('message::url', logHandle('command-link'), async (ctx) => {
  return ctx.conversation.enter(LINK_CONVERSATION)
}) // messages with URL in text or caption (photos, etc)

feature.on('message', logHandle('command-any'), async (ctx) => {
  try {
    const newUser = await createOrFindUser({
      telegramId: ctx.from.id,
      username: ctx.from.username ?? 'Unknown', // Use optional chaining and provide a default value
    })
    console.log('User username:', ctx.from.username)
    console.log('Created user:', newUser)
  }
  catch (error) {
    console.error('Error creating user:', error)
  }
  if (ctx.message.photo) {
    try {
      const file = await ctx.getFile() // valid for at least 1 hour

      if (!file) {
        throw new Error('No file received from Telegram')
      }

      const downloadLink = `https://api.telegram.org/file/bot${config.BOT_TOKEN}/${file.file_path}`

      const response = await axios.get(downloadLink, {
        responseType: 'arraybuffer',
      })

      const prompt = `
      I am currently documenting my day, the following picture is part of some moment.
      Is it a selfie, picture of a text or environment?
      \n IF so, respond in two lines:
      \n\n LINE 1: Describe the image with a deep meaning of the picture in one line.
      \n\n LINE 2: Describe the picture in 5 words.
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

      createThought(dataSummary)

      return ctx.reply(generatedContent)
    }
    catch {
      console.log('ERROR')
    }
  }
  else if (ctx.message.animation) {
    ctx.reply('You sent an animation.')
  }
  else if (ctx.message.text) {
    try {
      // // Generate the embedding for the incoming text
      // const embedding = await embed(ctx.message.text)

      // const similarThoughts = await findSimilarEmbeddings(ctx.from.id, embedding)
      // const similarThoughtsString = similarThoughts.map(thought => `ID: ${thought.id}, Content: ${thought.content}`).join('\n')

      // Reply with the similar thoughts
      // await ctx.reply(`You sent a text. Here are the top similar thoughts:\n${similarThoughtsString}`)
      await ctx.reply(`You sent a text. Here are the top similar thoughts`)
    }
    catch (error) {
      console.error('Error handling incoming text:', error)
      await ctx.reply('Failed to process your request. Please try again later.')
    }
  }
  else if (ctx.message.audio) {
    ctx.reply('You sent an audio file.')
  }
  else if (ctx.message.document) {
    ctx.reply('You sent a document.')
  }
  else if (ctx.message.video) {
    ctx.reply('You sent a video.')
  }
  else if (ctx.message.video_note) {
    ctx.reply('You sent a video note.')
  }
  else if (ctx.message.voice) {
    const voice = ctx.msg.voice as Voice
    let duration: number | undefined
    let fileId: string | undefined

    if (voice) {
      duration = voice.duration // in seconds
      fileId = voice.file_id
    }
    else {
      // Handle the case where voice is undefined (though unlikely if ctx.message.voice exists)
      console.error('Voice message is undefined')
    }

    if (duration !== undefined && duration < 60 && fileId !== undefined) {
      try {
        const config: IRecognitionConfig = {
          model: 'latest_short',
          encoding: 'OGG_OPUS',
          sampleRateHertz: 48000,
          audioChannelCount: 1,
          enableWordTimeOffsets: true,
          enableWordConfidence: true,
          languageCode: 'it-IT',
        }

        const gcsUri = await uploadFileToGCS(ctx, fileId)

        const audio = {
          uri: gcsUri,
        }

        const request = {
          config,
          audio,
        }

        // Start the long-running recognition operation
        const [operation] = await client.longRunningRecognize(request)

        // Perform the recognition asynchronously in the background
        getTranscript(operation, ctx)

        ctx.reply('Audio received.')
        ctx.chatAction = 'typing'
      }
      catch (error) {
        console.error('Error recognizing audio:', error)
        ctx.reply('Error recognizing audio.')
      }
    }
    else {
      ctx.reply('Audio must be shorter than 60 seconds. Accepting longer version soon!')
    }
  }
  else if (ctx.message.sticker) {
    ctx.reply('You sent a sticker.')
  }
  else {
    ctx.reply('Unknown file type or no file sent.')
  }
})

export { composer as anyFeature }

// Restructure thoughts, remove filler words and repeated concepts. Mke it easy to read and to share
// Make a summary at the end of the day

// Edit to change wwrite style
// Change language of second brain
//

// PRO, accept longer audios
// summary at end of day
