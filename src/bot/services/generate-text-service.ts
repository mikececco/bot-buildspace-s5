import { GoogleGenerativeAI } from '@google/generative-ai'

let instance: GoogleGenerativeAI | null

async function createGenerativeAIService(apiKey: string): Promise<(prompt: string, allThoughts: string, model: string) => Promise<string>> {
  if (!instance) {
    instance = new GoogleGenerativeAI(apiKey)
  }

  const generateContent = async (
    prompt: string,
    allThoughts: string,
    model: string,
  ): Promise<string> => {
    if (instance) {
      const modelInstance = instance.getGenerativeModel({
        model,
      })
      const result = await modelInstance.generateContent([prompt, allThoughts])
      return result.response.text()
      // Use modelInstance
    }
    return 'EMPTY'
  }

  return generateContent
}

export async function handleTextRequest(
  apiKey: string,
  allThoughts: string,
  prompt: string,
  model: string,
): Promise<string> {
  const generateContent = await createGenerativeAIService(apiKey)

  try {
    const generatedContent = await generateContent(prompt, allThoughts, model)
    // const jsonContent = JSON.stringify(generatedContent, undefined, 2)
    // console.log('HAVE JSON CONTENT')

    return generatedContent
  }
  catch (error) {
    console.error('Error generating content:', error)
    return 'Failed to generate content. Please try again later.'
  }
}
