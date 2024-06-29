import { handleTextRequest } from './generate-text-service.js'
import type { CreateBookmarkInput } from '#root/prisma/bookmark.js'
import { config } from '#root/config.js'

export async function categorizeWithGoogleCloud(bookmark: CreateBookmarkInput): Promise<string> {
  try {
    const text = `${bookmark.name} ${bookmark.link} ${bookmark.folder}`
    const prompt = `
      Given the information about a link below, exported from Chrome Bookmarks, categorize it to one of the categories:
      LINK: ${text}
      CATEGORIES: [AI, Personal Finance, Tool, Blog, Learning, Uncategorized]
      Return ONLY the category
      `
    const model = 'gemini-1.5-flash' // Corrected model name
    const generatedCategory = await handleTextRequest(
      config.GOOGLE_AI,
      prompt,
      model,
    )

    console.log(generatedCategory)
    return generatedCategory
  }
  catch (error) {
    console.error(`Error categorizing with Google Cloud: ${error}`)
    return 'Uncategorized'
  }
}
