// import { AssemblyAI } from 'assemblyai'
import { Composer } from 'grammy'
// import { config } from '#root/config.js'
import type { Context } from '#root/bot/context.js'
import { logHandle } from '#root/bot/helpers/logging.js'

const composer = new Composer<Context>()

const feature = composer.chatType('private')

// const client = new AssemblyAI({
//   apiKey: config.ASSEMBLY_AI,
// })

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
    // const file = await ctx.getFile() // valid for at least 1 hour
    // const path = file.file_path // file path on Bot API server

    // if (path) {
    //   const transcript = await client.transcripts.transcribe({ audio_url: path })

    //   console.log(transcript.text)
    //   if (transcript.text) {
    //     return ctx.reply(transcript.text)
    //   }
    //   console.log('hello')
    //   return ctx.reply('Empty')
    // }
    // else {
    //   console.error('audio_url is undefined')
    // }
  }
  else if (ctx.message.sticker) {
    ctx.reply('You sent a sticker.')
  }
  else {
    ctx.reply('Unknown file type or no file sent.')
  }
})

export { composer as anyFeature }
