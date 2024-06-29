import { Composer } from 'grammy'
import { SpeechClient } from '@google-cloud/speech'
import type { protos } from '@google-cloud/speech'
import type { Voice } from '@grammyjs/types'
import { uploadFileToGCS } from '#root/bot/services/upload-gc-bucket-service.js'
import { getTranscript } from '#root/bot/services/get-transcript-service.js'
import type { Context } from '#root/bot/context.js'
import { logHandle } from '#root/bot/helpers/logging.js'
import { createOrFindUser } from '#root/prisma/create-user.js'
import { findSimilarEmbeddings } from '#root/prisma/embedding.js'
import {
  DOCUMENT_CONVERSATION,
  IMAGE_CONVERSATION,
  LINK_CONVERSATION,
} from '#root/bot/conversations/index.js'
import { embed } from '#root/bot/services/embed-service.js'
import { completion } from '#root/bot/services/completion-service.js'

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
    return ctx.conversation.enter(IMAGE_CONVERSATION)
  }
  else if (ctx.message.animation) {
    ctx.reply('You sent an animation.')
  }
  else if (ctx.message.text) {
    try {
      // // Generate the embedding for the incoming text
      ctx.chatAction = 'typing'
      const question = ctx.message.text
      const embedding = await embed(question)
      const similarThoughts = await findSimilarEmbeddings(ctx, embedding)

      const completed = await completion(similarThoughts, question)

      await ctx.reply(completed)
      // await ctx.reply(`From`)
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
    return ctx.conversation.enter(DOCUMENT_CONVERSATION)
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
