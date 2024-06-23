import { embed } from '#root/bot/services/embed-service.js'
import { toArrayStrings } from '#root/bot/services/array-strings-service.js'
import { saveEmbedding } from '#root/prisma/embedding.js'
import type { CreateEmbeddingInput } from '#root/prisma/embedding.js'
import type { CreateBookmarkInput } from '#root/prisma/bookmark.js'
import { saveBookmark } from '#root/prisma/bookmark.js'

export async function createBookmarkContext(ctx: any, dataSummary: CreateBookmarkInput, content: any) {
  const linkContent = content // Assign provided content to linkContent if available

  let bookmark
  if (dataSummary) {
    bookmark = await saveBookmark(dataSummary)
  }
  if (bookmark) {
    const arrayStringsContent = await toArrayStrings(linkContent)

    // Process each string in arrayStringsContent
    for (const information of arrayStringsContent) {
      const embedding = await embed(information)

      const embeddingData: CreateEmbeddingInput = {
        telegramId: ctx.from.id,
        username: ctx.from.username || 'Unknown',
        content: information,
        embedding,
        bookmarkId: bookmark.id,
      }
      await saveEmbedding(embeddingData)
    }
  }
}
