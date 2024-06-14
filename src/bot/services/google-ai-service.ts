import type { InlineDataPart } from '@google/generative-ai'
import { GoogleGenerativeAI } from '@google/generative-ai'

let instance: GoogleGenerativeAI | null

async function createGenerativeAIService(apiKey: string): Promise<(prompt: string, image: InlineDataPart, model: string) => Promise<string>> {
  if (!instance) {
    instance = new GoogleGenerativeAI(apiKey)
  }

  const generateContent = async (
    prompt: string,
    image: InlineDataPart,
    model: string,
  ): Promise<string> => {
    if (instance) {
      const modelInstance = instance.getGenerativeModel({
        model,
      })
      const result = await modelInstance.generateContent([prompt, image])
      return result.response.text()
      // Use modelInstance
    }
    return 'EMPTY'
  }

  return generateContent
}

export async function handleGenerateContentRequest(
  apiKey: string,
  prompt: string,
  imageDataPart: InlineDataPart,
  model: string,
): Promise<string> {
  const generateContent = await createGenerativeAIService(apiKey)

  try {
    const generatedContent = await generateContent(prompt, imageDataPart, model)
    // const jsonContent = JSON.stringify(generatedContent, undefined, 2)
    // console.log('HAVE JSON CONTENT')

    return generatedContent
  }
  catch (error) {
    console.error('Error generating content:', error)
    return 'Failed to generate content. Please try again later.'
  }
}
