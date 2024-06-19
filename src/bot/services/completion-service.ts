import { handleTextRequest } from '#root/bot/services/generate-text-service.js'
import { config } from '#root/config.js'

export async function completion(context: any, question: string) {
  const contentList: string[] = []
  let prompt

  if (typeof context === 'object' && context !== null) {
    // Loop over the keys of the context object
    for (const key of Object.keys(context)) {
      // Assuming each key in context has a 'content' property
      if (context[key].content) {
        contentList.push(context[key].content)
      }
    }
    prompt = `
    Given the CONTEXT below, answer the following question
    QUESTION: ${question}
    CONTEXT: ${contentList}
    Answer in english
    `
  }
  else {
    prompt = `
    Given the CONTEXT below, answer the following question
    QUESTION: ${question}
    CONTEXT: ${context}
    Answer in english
    `
  }
  const model = 'gemini-1.5-flash' // Corrected model name

  const generatedContent = await handleTextRequest(
    config.GOOGLE_AI,
    prompt,
    model,
  )
  return generatedContent
}
