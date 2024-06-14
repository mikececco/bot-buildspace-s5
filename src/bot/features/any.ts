// import { Buffer } from 'node:buffer'
// import fs from 'node:fs'
// import path from 'node:path'
// import { AssemblyAI } from 'assemblyai'
import { Composer } from 'grammy'
import { SpeechClient } from '@google-cloud/speech'
import type { protos } from '@google-cloud/speech'
import { config } from '#root/config.js'
import { uploadFileToGCS } from '#root/bot/services/upload-gc-bucket-service.js'
import { inngest } from '#root/bot/services/get-transcript-service.js'
import type { Context } from '#root/bot/context.js'
import { logHandle } from '#root/bot/helpers/logging.js'

type IRecognitionConfig = protos.google.cloud.speech.v1.IRecognitionConfig

const composer = new Composer<Context>()

const feature = composer.chatType('private')

// const clientAssembly = new AssemblyAI({
//   apiKey: config.ASSEMBLY_AI,
// })

// Creates a client
const client = new SpeechClient()

feature.on('message', logHandle('command-any'), async (ctx) => {
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

      // const gcsUri = await uploadFileToGCS(ctx)
      const gcsUri = 'gs://buildspace-project-audios/output_filename.ogg'

      const audio = {
        uri: gcsUri,
      }

      const request = {
        config,
        audio,
      }

      // await inngest.send({
      //   name: 'app/long-running-recognition.completed',
      //   data: { client, request, ctx },
      // })

      const [operation] = await client.longRunningRecognize(request)
      // Get a Promise representation of the final result of the job.
      const [response] = await operation.promise()
      if (response.results) {
        const transcription = response.results
          .map(result => result.alternatives?.[0]?.transcript) // Optional chaining (?.) added here
          .join('\n')
        await ctx.reply(transcription)
      }
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

console.log('anyFeature registered')

export { composer as anyFeature }

// Restructure thoughts, remove filler words and repeated concepts. Mke it easy to read and to share
// Make a summary at the end of the day

// Edit to change wwrite style
// Change language of second brain
//

// PRO, accept longer audios
// summary at end of day

// import { AssemblyAI } from 'assemblyai'
// import { Composer } from 'grammy'
// import { SpeechClient } from '@google-cloud/speech'
// import type { protos } from '@google-cloud/speech'
// import { config } from '#root/config.js'
// import type { Context } from '#root/bot/context.js'
// import { logHandle } from '#root/bot/helpers/logging.js'

// type IRecognitionConfig = protos.google.cloud.speech.v1.IRecognitionConfig

// const composer = new Composer<Context>()

// const feature = composer.chatType('private')

// // const clientAssembly = new AssemblyAI({
// //   apiKey: config.ASSEMBLY_AI,
// // })

// // Creates a client
// const client = new SpeechClient()

// feature.on('message', logHandle('command-any'), async (ctx) => {
//   if (ctx.message.photo) {
//     ctx.reply('You sent a photo.')
//   }
//   else if (ctx.message.animation) {
//     ctx.reply('You sent an animation.')
//   }
//   else if (ctx.message.audio) {
//     ctx.reply('You sent an audio file.')
//   }
//   else if (ctx.message.document) {
//     ctx.reply('You sent a document.')
//   }
//   else if (ctx.message.video) {
//     ctx.reply('You sent a video.')
//   }
//   else if (ctx.message.video_note) {
//     ctx.reply('You sent a video note.')
//   }
//   else if (ctx.message.voice) {
//     ctx.reply('Audio received.')
//     ctx.chatAction = 'typing'
//     const file = await ctx.getFile() // valid for at least 1 hour
//     const path = file.file_path // file path on Bot API server
//     // const fileUrl = `https://api.telegram.org/file/bot${config.BOT_TOKEN}/${path}`

//     // Construct the URL with BOT_TOKEN
//     const fileUrl = `https://api.telegram.org/file/bot${config.BOT_TOKEN}/${path}`

//     // The path to the remote LINEAR16 file
//     const gcsUri = fileUrl

//     // The audio file's encoding, sample rate in hertz, and BCP-47 language code
//     const audio = {
//       uri: gcsUri,
//     }
//     const config: IRecognitionConfig = {
//       encoding: 'LINEAR16',
//       sampleRateHertz: 16000,
//       languageCode: 'en-US',
//     }
//     const request = {
//       audio,
//       config,
//     }

//     // Detects speech in the audio file
//     const [response] = await client.recognize(request)

//     if (response.results) {
//       const transcription = response.results
//         .map(result => result.alternatives?.[0]?.transcript) // Optional chaining (?.) added here
//         .filter(transcript => transcript !== undefined) // Filter out undefined values
//         .join('\n')

//       return ctx.reply(transcription)
//     }
//   }

//   // if (path) {
//   //   const transcript = await client.transcripts.transcribe({ audio_url: fileUrl })

//   //   console.log(transcript.text)
//   //   if (transcript.text) {
//   //     return ctx.reply(transcript.text)
//   //   }
//   //   console.log('hello')
//   //   return ctx.reply('Empty')
//   // }
//   // else {
//   //   console.error('audio_url is undefined')
//   // }
//   else if (ctx.message.sticker) {
//     ctx.reply('You sent a sticker.')
//   }
//   else {
//     ctx.reply('Unknown file type or no file sent.')
//   }
// })

// console.log('anyFeature registered')

// export { composer as anyFeature }

// // Restructure thoughts, remove filler words and repeated concepts. Mke it easy to read and to share
// // Make a summary at the end of the day

// // Edit to change wwrite style
// // Change language of second brain
// //

// // PRO, accept longer audios
// // summary at end of day
