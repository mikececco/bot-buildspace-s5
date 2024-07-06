import { config } from 'node:process'
import { Composer, InlineKeyboard } from 'grammy'
import { SpeechClient } from '@google-cloud/speech'
import axios from 'axios'
import type { protos } from '@google-cloud/speech'
import type { Voice } from '@grammyjs/types'
// import { uploadFileToGCS } from '#root/bot/services/upload-gc-bucket-service.js'
import { getTranscript } from '#root/bot/services/get-transcript-service.js'
import type { Context } from '#root/bot/context.js'
import { logHandle } from '#root/bot/helpers/logging.js'
import { createOrFindUser } from '#root/prisma/create-user.js'
import { findSimilarEmbeddings } from '#root/prisma/embedding.js'
import {
  DOCUMENT_CONVERSATION,
  IMAGE_CONVERSATION,
  LINK_CONVERSATION,
  SIMPLE_LINK_CONVERSATION,
} from '#root/bot/conversations/index.js'
import { embed } from '#root/bot/services/embed-service.js'
import { completion } from '#root/bot/services/completion-service.js'
import { sendInvoice } from '#root/bot/services/payment-service.js'
import type { SendInvoiceParams } from '#root/bot/services/payment-service.js'
import { getDocument } from '#root/bot/services/get-bookmark-service.js'
import { saveBookmarks } from '#root/prisma/bookmark.js'

// type IRecognitionConfig = protos.google.cloud.speech.v1.IRecognitionConfig

const composer = new Composer<Context>()

const feature = composer.chatType('private')

// Creates a client
// const client = new SpeechClient()
// async function sendStatusToWebhook(statusMessage: any) {
//   try {
//     const webhookUrl = 'https://vocal-sensible-hippo.ngrok-free.app/webhook' // Replace with your actual webhook URL
//     const response = await axios.post(webhookUrl, {
//       text: statusMessage,
//     })

//     console.log('Status sent to webhook:', response.data)
//   }
//   catch (error) {
//     console.error('Error sending status to webhook:', error)
//     // Handle webhook sending error as needed
//   }
// }

feature.on('message::url', logHandle('command-link'), async (ctx) => {
  return ctx.conversation.enter(SIMPLE_LINK_CONVERSATION)
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
    ctx.reply('You sent an audio.')
  }
  else if (ctx.message.document) {
    await ctx.reply(`Analizing your document, please wait...`)
    ctx.chatAction = 'typing'
    try {
      const { count, bookmarksList } = await getDocument(ctx)
      await ctx.reply(`${count} bookmarks counted and saved.`)

      // Run saveBookmarks asynchronously
      saveBookmarks(bookmarksList)
        .then(() => {
          console.error('Saved in saveBookmarks')
        })
        .catch((error) => {
          console.error('Error in saveBookmarks:', error)
          // Handle the error gracefully, notify the user or log the issue
          // Example: ctx.reply('An error occurred while saving bookmarks.')
        })
      // Assuming webhook sending is somewhere else in your code
      // If it's here, you should handle errors similarly
      // Example: await sendToWebhook(data)

      // Return success response or continue with other logic
    }
    catch (error) {
      console.error('Error in saveBookmarks:', error)

      // Handle the error gracefully, perhaps notify the user or log the issue
      await ctx.reply('An error occurred while saving bookmarks. Please try again later.')

      // Optionally, rethrow the error if you want to propagate it further
      // throw error
    }
    // await ctx.reply(`Tomorrow you will receive your first bookmarks to go through!`)
    const button = new InlineKeyboard().webApp('Your library', 'https://bot-telegram-webapp.vercel.app/')

    return await ctx.reply(`You can now access your library!`, {
      reply_markup: button,
    })
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
        // const config: IRecognitionConfig = {
        //   model: 'latest_short',
        //   encoding: 'OGG_OPUS',
        //   sampleRateHertz: 48000,
        //   audioChannelCount: 1,
        //   enableWordTimeOffsets: true,
        //   enableWordConfidence: true,
        //   languageCode: 'it-IT',
        // }

        // const gcsUri = await uploadFileToGCS(ctx, fileId)

        // const audio = {
        //   uri: gcsUri,
        // }

        // const request = {
        //   config,
        //   audio,
        // }

        // // Start the long-running recognition operation
        // const [operation] = await client.longRunningRecognize(request)

        // // Perform the recognition asynchronously in the background
        // getTranscript(operation, ctx)

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

feature.on('pre_checkout_query', logHandle('command-payment-query'), async (ctx) => {
  console.log('Update on payment.')
  console.log(ctx)
  // ctx.answerPreCheckoutQuery(true)
})

feature.callbackQuery(/callback-(save|delete):(\d+)/, logHandle('keyboard-bookmark-day-select'), async (ctx) => {
  const action = ctx.match[1] // 'save' or 'delete'
  const bookmarkId = Number(ctx.match[2]) // Extract the bookmark ID
  if (action === 'save') {
    // Handle save action for the bookmark with bookmarkId
  }
  else if (action === 'delete') {
    // Handle delete action for the bookmark with bookmarkId
  }
  await ctx.answerCallbackQuery()

  console.log(`User pressed ${action}`)
  console.log(`On ${bookmarkId}`)
})
feature.callbackQuery('callback-delete', logHandle('keyboard-bookmark-day-select'), async (ctx) => {
  const callbackData = ctx.callbackQuery.data

  console.log(`User pressed ${callbackData}`)
})

feature.callbackQuery('/callback-folder-(.+)/', logHandle('keyboard-bookmark-select-folder'), async (ctx) => {
  const folderName = ctx.match[1] // Extract folder name from callback data
  const additionalContext = ctx.match[2] // Extract additional context from callback data
  console.log(ctx.message)

  console.log(`User chose ${folderName}`)
  console.log(`User chose ${additionalContext}`)
  console.log(await ctx.answerCallbackQuery(folderName))
  await ctx.answerCallbackQuery()
})

export { composer as anyFeature }

// Restructure thoughts, remove filler words and repeated concepts. Mke it easy to read and to share
// Make a summary at the end of the day

// Edit to change wwrite style
// Change language of second brain
//

// PRO, accept longer audios
// summary at end of day
