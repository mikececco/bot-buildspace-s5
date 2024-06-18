import { config } from '#root/config.js'

export async function embed(text: string): Promise<number[]> {
  const url = 'https://api.jina.ai/v1/embeddings'

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${config.JINA}`,
  }

  const data = {
    input: text,
    model: 'jina-embeddings-v2-base-en',
    encoding_type: 'float',
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const responseData = await response.json()
    return responseData.data[0].embedding
  }
  catch (error) {
    console.error('Error embedding text:', error)
    throw error
  }
}
