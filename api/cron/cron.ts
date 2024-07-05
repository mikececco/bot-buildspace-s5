// import { PrismaClient } from '@prisma/client'
// import { InlineKeyboard } from 'grammy'
// import { bot } from '#root/main.js'

// const prisma = new PrismaClient()

// export async function executeCronJob(ctx: any) {
//   console.log('inside functionn')
//   try {
//     // Fetch all users
//     const users = await prisma.user.findMany({
//       include: { bookmarks: true },
//     })

//     // Array to store results for each user

//     // Process each user
//     for (const user of users) {
//       // Take only the first bookmark
//       const firstBookmark = user.bookmarks[0]
//       if (!firstBookmark)
//         continue
//       // Prepare the message for the first bookmark
//       const markdownMessage = `**Bookmark 1:** [${firstBookmark.link}](${firstBookmark.link}) - ${firstBookmark.folder}`
//       const bookmarkId = firstBookmark.id
//       const saveCallbackData = `callback-save:${bookmarkId}`
//       const deleteCallbackData = `callback-delete:${bookmarkId}`

//       const keyboard = new InlineKeyboard()
//         .text('Save it', saveCallbackData)
//         .row()
//         .text('Delete it', deleteCallbackData)
//       // const keyboard = new InlineKeyboard()
//       //   .text('Save it', 'callback-save')
//       //   .row()
//       //   .text('Delete it', 'callback-delete')
//         // .url('Telegram', 'telegram.org')

//       await bot.api.sendMessage(
//         Number(user.telegramId),
//         markdownMessage,
//         {
//           reply_markup: keyboard,
//           parse_mode: 'Markdown',
//         },
//       )
//       console.log(ctx)
//     }
//   }
//   catch (error) {
//     console.error('An error occurred during cron execution:', error)
//   }
//   finally {
//     await prisma.$disconnect()
//   }
// }
