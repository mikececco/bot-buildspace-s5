// import { Buffer } from 'node:buffer'
// import fs from 'node:fs'
// import path from 'node:path'
// import { AssemblyAI } from 'assemblyai'
import { Composer } from 'grammy'
import { SpeechClient } from '@google-cloud/speech'
import type { protos } from '@google-cloud/speech'
import { config } from '#root/config.js'
import { uploadFileToGCS } from '#root/bot/services/upload-gc-bucket-service.js'
import { getTranscript } from '#root/bot/services/get-transcript-service.js'
import type { Context } from '#root/bot/context.js'
import { logHandle } from '#root/bot/helpers/logging.js'
import { createOrFindUser } from '#root/prisma/create-user.js'

type IRecognitionConfig = protos.google.cloud.speech.v1.IRecognitionConfig

const composer = new Composer<Context>()

const feature = composer.chatType('private')

// const clientAssembly = new AssemblyAI({
//   apiKey: config.ASSEMBLY_AI,
// })

// Creates a client
const client = new SpeechClient()

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
    ctx.reply('You sent a photo.')
  }
  else if (ctx.message.animation) {
    ctx.reply('You sent an animation.')
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

      const gcsUri = await uploadFileToGCS(ctx)
      // const gcsUri = 'gs://buildspace-project-audios/output_filename.ogg'

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
