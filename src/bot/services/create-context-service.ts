import { embed } from '#root/bot/services/embed-service.js'
import { toArrayStrings } from '#root/bot/services/array-strings-service.js'
import type { CreateThoughtInput } from '#root/prisma/create-thought.js'
import { getLinkContent } from '#root/bot/services/get-link-content-service.js'
import { createThought } from '#root/prisma/create-thought.js'
import { saveEmbedding } from '#root/prisma/embedding.js'
import type { CreateEmbeddingInput } from '#root/prisma/embedding.js'

export async function createContext(ctx: any, dataSummary?: CreateThoughtInput, content?: any) {
  let linkContent = content // Assign provided content to linkContent if available

  // If dataSummary is not provided, fetch link content from message text
  if (!dataSummary && !linkContent) {
    linkContent = await getLinkContent(ctx.message.text)
    dataSummary = {
      telegramId: ctx.from.id,
      username: ctx.from.username || 'Unknown',
      content: linkContent,
    }
  }
  let thought
  if (dataSummary) {
    thought = await createThought(dataSummary)
  }
  // Convert linkContent into array of strings of a certain size
  const arrayStringsContent = await toArrayStrings(linkContent)

  // Process each string in arrayStringsContent
  for (const information of arrayStringsContent) {
    const embedding = await embed(information)
    if (embedding && thought) {
      console.log('SAVING TO EMBEDDING')

      const embeddingData: CreateEmbeddingInput = {
        telegramId: ctx.from.id,
        username: ctx.from.username || 'Unknown',
        content: information,
        embedding,
        thoughtId: thought.id,
      }
      await saveEmbedding(embeddingData)
    }
  }
}
