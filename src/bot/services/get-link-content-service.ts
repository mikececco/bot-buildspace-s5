import { config } from '#root/config.js'
import { handleTextRequest } from '#root/bot/services/generate-text-service.js'

export async function getLinkContent(link: string): Promise<string> {
  const baseUrl = 'https://r.jina.ai/'
  const headers = {
    'Accept': 'application/json',
    'Authorization': `Bearer ${config.JINA}`,
    'X-With-Links-Summary': 'true',
    'X-With-Images-Summary': 'true',
    'X-No-Cache': 'true',
    'X-Timeout': '5',

  }

  const finishedUrl = baseUrl + link

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
    // return responseData.data.content
    return await generateLinkSummary(responseData.data.content)
  }
  catch (error) {
    console.error('Error processing long-running operation:', error)
    return ('Failed to fetch and process link content')
    // Handle error appropriately
  }
}

export async function generateLinkSummary(linkContent: string) {
  const model = 'gemini-1.5-flash' // Corrected model name
  const prompt = `
  Summarize and describe the content extensively and objectively, translate to english if its needed, point out the main points.
  Donn't say 'this appears to be" or "the provided content consists of".
  Content: ${linkContent}
  `
  const generatedContent = await handleTextRequest(
    config.GOOGLE_AI,
    prompt,
    model,
  )
  return generatedContent
}
