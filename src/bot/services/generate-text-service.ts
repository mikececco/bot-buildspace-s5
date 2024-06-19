import { GoogleGenerativeAI } from '@google/generative-ai'

let instance: GoogleGenerativeAI | null = null

async function createGenerativeAIService(apiKey: string): Promise<(prompt: string, model: string) => Promise<string>> {
  if (!instance) {
    instance = new GoogleGenerativeAI(apiKey)
  }

  const generateContent = async (
    prompt: string,
    model: string,
  ): Promise<string> => {
    if (instance) {
      const modelInstance = instance.getGenerativeModel({
        model,
      })
      const result = await modelInstance.generateContent(prompt)
      return result.response.text()
    }
    return 'EMPTY'
  }

  return generateContent
}

export async function handleTextRequest(
  apiKey: string,
  prompt: string,
  model: string,
): Promise<string> {
  const generateContent = await createGenerativeAIService(apiKey)

  try {
    const generatedContent = await generateContent(prompt, model)
    return generatedContent
  }
  catch (error) {
    console.error('Error generating content:', error)
    return 'Failed to generate content. Please try again later.'
  }
}
