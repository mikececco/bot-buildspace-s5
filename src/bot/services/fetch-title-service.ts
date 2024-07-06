import * as cheerio from 'cheerio'

export async function fetchMetadata(url: any) {
  try {
    const response = await fetch(url)
    const body = await response.text()
    const $ = cheerio.load(body)

    // Extract the title
    const title = $('title').text().trim()

    // Extract the description
    const description = $('meta[name="description"]').attr('content')?.trim() || 'No description available'

    return { title, description }
  }
  catch (error) {
    console.error('Error fetching metadata:', error)
    return { title: 'No title available', description: 'No description available' }
  }
}
