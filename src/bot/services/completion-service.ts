import { handleTextRequest } from '#root/bot/services/generate-text-service.js'
import { config } from '#root/config.js'

export async function completion(context: string, question: string) {
  const model = 'gemini-1.5-flash' // Corrected model name
  const prompt = `
  Given the CONTEXT below, answer the following question ${question}
  CONTEXT: ${context}
  Answer in english
  `
  const generatedContent = await handleTextRequest(
    config.GOOGLE_AI,
    prompt,
    model,
  )
  return generatedContent
}
