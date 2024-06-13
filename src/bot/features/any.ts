import { AssemblyAI } from 'assemblyai'
import { Composer } from 'grammy'
import { SpeechClient } from '@google-cloud/speech'
import type { protos } from '@google-cloud/speech'
import { config } from '#root/config.js'
import { uploadFileToGCS } from '#root/bot/services/upload-gc-bucket-service.js'
import type { Context } from '#root/bot/context.js'
import { logHandle } from '#root/bot/helpers/logging.js'

// type IRecognitionConfig = protos.google.cloud.speech.v1.IRecognitionConfig

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
    ctx.reply('Audio received.')
    ctx.chatAction = 'typing'

    ctx.reply('Audio received.')
    ctx.chatAction = 'typing'

    try {
      // Upload audio file to GCS and get GCS media link
      const gcsUri = await uploadFileToGCS(ctx)

      if (!gcsUri) {
        throw new Error('Failed to upload file to GCS or empty URI returned.')
      }
      // Transcribe audio from GCS URI
      const [response] = await client.recognize({
        audio: {
          uri: gcsUri,
        },
        config: {
          encoding: 'LINEAR16',
          sampleRateHertz: 16000,
          languageCode: 'en-US',
        },
      })
      console.log(response)

      if (response.results && response.results.length > 0) {
        const transcription = response.results?.[0]?.alternatives?.[0]?.transcript
        return ctx.reply(transcription || 'No transcription available.')
      }
      return ctx.reply('Failed')
    }
    catch (error) {
      console.error('Error recognizing audio:', error)
      ctx.reply('Error recognizing audio.')
    }
    // const file = await ctx.getFile() // valid for at least 1 hour

    // The path to the remote LINEAR16 file
    // const gcsUri = `https://api.telegram.org/file/bot${config.BOT_TOKEN}/${path}`
    // const gcsUri = 'gs://cloud-samples-data/speech/brooklyn_bridge.raw'

    // // The audio file's encoding, sample rate in hertz, and BCP-47 language code
    // const audio = {
    //   uri: gcsUri,
    // }
    // const config: IRecognitionConfig = {
    //   encoding: 'LINEAR16',
    //   sampleRateHertz: 16000,
    //   languageCode: 'en-US',
    // }
    // const request = {
    //   audio,
    //   config,
    // }

    // // Detects speech in the audio file
    // const [response] = await client.recognize(request)

    // if (response.results) {
    //   const transcription = response.results
    //     .map(result => result.alternatives?.[0]?.transcript) // Optional chaining (?.) added here
    //     .filter(transcript => transcript !== undefined) // Filter out undefined values
    //     .join('\n')

    //   return ctx.reply(transcription)
    // }
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
