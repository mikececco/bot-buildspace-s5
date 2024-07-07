import { Composer } from 'grammy'
import type { Context } from '#root/bot/context.js'
import { logHandle } from '#root/bot/helpers/logging.js'
// import { createSummary } from '#root/prisma/create-summary.js'
import { deleteSession, deleteUser } from '#root/prisma/destroy-session.js'
// import type { CreateSummaryInput } from '#root/prisma/create-summary.js'
// import { createThoughtSummary } from '#root/prisma/create-thought-summary.js'
import { getThoughtsOfDay } from '#root/prisma/get-thoughts.js'
import type { GetThoughtsInput } from '#root/prisma/get-thoughts.js'

const composer = new Composer<Context>()

const feature = composer.chatType('private')

feature.command('start', logHandle('command-start'), (ctx) => {
  return ctx.reply(ctx.t('welcome'))
})

feature.command('destroy', logHandle('command-destroy'), async (ctx) => {
  try {
    // Assuming deleteSession is an asynchronous function
    await deleteSession('352550606')
    return ctx.reply('Deleted')
  }
  catch (error) {
    console.error('Error deleting session:', error)
    return ctx.reply('Failed to delete session. Please try again later.')
  }
})

feature.command('bye', logHandle('command-destroy'), (ctx) => {
  try {
    // Assuming deleteSession is an asynchronous function
    deleteUser(352550606)
    return ctx.reply('User deleted')
  }
  catch (error) {
    console.log('Error deleting session:', error)
    return ctx.reply('Failed to delete session. Please try again later.')
  }
})

// feature.command('summary', logHandle('command-summary'), async (ctx) => {
//   try {
//     const dataSummary: CreateSummaryInput = {
//       telegramId: ctx.from.id, // Replace with actual Telegram user ID
//       username: ctx.from.username || 'Unknown', // Replace with actual username, default to 'Unknown' if not provided
//       date: new Date(), // Use the current date
//     }

//     const dataThoughts: GetThoughtsInput = {
//       telegramId: ctx.from.id, // Replace with actual Telegram user ID
//       username: ctx.from.username || 'Unknown', // Replace with actual username, default to 'Unknown' if not provided
//       date: new Date(), // Use the current date
//     }

//     const thoughts = await getThoughtsOfDay(dataThoughts)

//     const summaryDay = await createSummary(dataSummary)

//     if (summaryDay) {
//       // Create thought summaries for each thought
//       const thoughtSummaryPromises = thoughts.map(thought => createThoughtSummary(thought.id, summaryDay.id))
//       await Promise.all(thoughtSummaryPromises)

//       return ctx.reply(`Summary: ${summaryDay.content}`)
//     }
//     else {
//       return ctx.reply('No summary was generated.')
//     }
//   }
//   catch (error) {
//     console.error('Error generating summary:', error)
//     return ctx.reply('Failed to generate summary. Please try again later.')
//   }
// })

export { composer as welcomeFeature }
