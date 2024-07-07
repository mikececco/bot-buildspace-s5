import fetch from 'node-fetch'

export async function fetchMetadata(url: string) {
  try {
    const response = await fetch(url, { method: 'HEAD' })

    if (!response.ok) {
      return { title: 'Error', description: response.status }
    }

    const title = response.headers.get('title') || 'No title available'
    const description = response.headers.get('description') || 'No description available'

    return { title, description }
  }
  catch (error) {
    console.error('Error fetching metadata:', error)
    return { title: 'Error', description: error }
  }
}
