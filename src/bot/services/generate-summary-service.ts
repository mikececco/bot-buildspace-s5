import type { Thought } from '@prisma/client' // Adjust the import based on your project structure
import { handleTextRequest } from '#root/bot/services/generate-text-service.js'
import { config } from '#root/config.js'

const prompt = `
I am currently journaling my day.
I will send you all of my thoughts, links and image description of today.
Summarize in a journal way, to be able to useful when I will read it again
`

export async function generateThoughtsSummary(thoughts: Thought[]) {
  const model = 'gemini-1.5-flash' // Corrected model name
  const allThoughts = thoughts.map(thought => thought.content).join('\n')

  const generatedContent = await handleTextRequest(
    config.GOOGLE_AI,
    prompt,
    allThoughts,
    model,
  )
  return generatedContent
}
