// import { prisma } from '#root/prisma/index.js'
// import { getThoughtsOfDay } from '#root/prisma/get-thoughts.js'
// import type { GetThoughtsInput } from '#root/prisma/get-thoughts.js'
// import { generateThoughtsSummary } from '#root/bot/services/generate-summary-service.js'

// export interface CreateSummaryInput {
//   telegramId: number
//   username: string
//   date: Date
// }

// export async function createSummary(data: CreateSummaryInput) {
//   try {
//     // Find the user by telegramId
//     let user = await prisma.user.findUnique({
//       where: {
//         telegramId: data.telegramId,
//       },
//     })

//     // If the user doesn't exist, create a new user
//     if (!user) {
//       user = await prisma.user.create({
//         data: {
//           telegramId: data.telegramId,
//           username: data.username,
//         },
//       })
//     }

//     const dataThoughts: GetThoughtsInput = {
//       telegramId: data.telegramId, // Replace with actual Telegram user ID
//       username: data.username, // Replace with actual username
//       date: data.date, // Replace with the date you want to query
//     }

//     // Fetch thoughts of the day for the user
//     const thoughts = await getThoughtsOfDay(dataThoughts)
//     const thoughtsSummary = await generateThoughtsSummary(thoughts)

//     // Create summary and connect thoughts
//     const summary = await prisma.summary.create({
//       data: {
//         content: thoughtsSummary,
//         user: {
//           connect: {
//             id: user.id,
//           },
//         },
//       },
//     })

//     // Return the created summary
//     return summary
//   }
//   catch (error) {
//     console.error('Error creating summary:', error)
//     throw error
//   }
//   finally {
//     await prisma.$disconnect()
//   }
// }
