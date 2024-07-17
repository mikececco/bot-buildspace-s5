import { handleTextRequest } from './generate-text-service.js'
import { config } from '#root/config.js'

export async function categorizeWithGoogleCloud(contentUrl: string): Promise<string> {
  try {
    const prompt = `
      You are a great analyst and category manager.
      Analyze the following URL content and assign it 3 suitable categories:
      CONTENT: ${contentUrl}
      CATEGORIES TO CHOOSE FROM: [TRAVEL, FOOD, VIDEO, BLOG, CAREER, SOCIAL MEDIA, EDUCATION, COURSE, BLOCKCHAIN, CRYPTO, WEB DEVELOPMENT, TUTORIAL, SOFTWARE, APP, ENTERTAINMENT]
      -IF YOU ARE NOT ABLE TO ASSIGN IT ANY CATEGORY, return:
      \n UNDEFINED
      -IF YOU SELECTED 1 TO 3 CATEGORIES, RETURN THE SELECTED CATEGORIES SEPARATED BY A COMMA LIKE:
      \n BLOG, VIDEO, FOOD
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
