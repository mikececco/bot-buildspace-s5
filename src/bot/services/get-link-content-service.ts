import { config } from '#root/config.js'
import { handleTextRequest } from '#root/bot/services/generate-text-service.js'

export async function getLinkContent(text: string, ctx: any) {
  const baseUrl = 'https://r.jina.ai/'
  const headers = {
    'Accept': 'application/json',
    'Authorization': `Bearer ${config.JINA}`,
    'X-With-Links-Summary': 'true',
    'X-With-Images-Summary': 'true',
  }

  const finishedUrl = baseUrl + text

  try {
    console.log('Request URL:', finishedUrl)
    console.log('Headers:', headers)

    const response = await fetch(finishedUrl, {
      method: 'GET',
      headers,
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`HTTP error! status: ${response.status}, response: ${errorText}`)
    }

    const responseData = await response.json()
    return generateLinkSummary(responseData.data.content, ctx)
  }
  catch (error) {
    console.error('Error processing long-running operation:', error)
    // Handle error appropriately
  }
}

const prompt = `
Summarize the content in two sentences so that I can retrieve it when I need it, and translate to english if not yet.
`

async function generateLinkSummary(linkContent: string, ctx: any) {
  const model = 'gemini-1.5-flash' // Corrected model name

  const generatedContent = await handleTextRequest(
    config.GOOGLE_AI,
    prompt,
    linkContent,
    model,
  )
  await ctx.reply(generatedContent)
}
