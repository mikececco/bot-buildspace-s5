import { embed } from '#root/bot/services/embed-service.js'
import { toArrayStrings } from '#root/bot/services/array-strings-service.js'
import type { CreateThoughtInput } from '#root/prisma/create-thought.js'
import { getLinkContent } from '#root/bot/services/get-link-content-service.js'
import { createThought } from '#root/prisma/create-thought.js'
import { saveEmbedding } from '#root/prisma/embedding.js'

export async function createContext(ctx: any) {
  const linkContent = await getLinkContent(ctx.message.text, ctx)

  const dataSummary: CreateThoughtInput = {
    telegramId: ctx.from.id, // Replace with actual Telegram user ID
    username: ctx.from.username || 'Unknown', // Replace with actual username, default to 'Unknown' if not provided
    content: linkContent,
  }
  const thought = await createThought(dataSummary)
  console.log('CREATED THOUGHT')

  const arrayStringsContent = await toArrayStrings(linkContent) // WRITE THE toArrayStrings to split the linkContent into strings of array of a certain size

  // const question = 'how much does it cost'

  arrayStringsContent.map(async (information: string) => {
    const embedding = await embed(information)
    if (embedding) {
      console.log('SAVING TO EMBEDDING')
      saveEmbedding(ctx.from.id, ctx.from.username || 'Unknown', information, embedding, thought.id)
    }
  })
}
