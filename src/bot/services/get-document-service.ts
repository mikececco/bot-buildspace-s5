import * as fs from 'node:fs'
import axios from 'axios'
import * as cheerio from 'cheerio'
import type { Context } from '#root/bot/context.js'
import { config } from '#root/config.js'

function arrayBufferToString(buffer: ArrayBuffer): string {
  return new TextDecoder().decode(buffer)
}

// function extractLinksFromDlDt(htmlContent: string): Record<string, { links: string[] }> {
//   const $ = cheerio.load(htmlContent)
//   const bookmarks: Record<string, { links: string[] }> = {}

//   $('dl').each((_, dlElement) => {
//     const $dl = $(dlElement)
//     $dl.find('dt').each((_, dtElement) => {
//       const $dt = $(dtElement)
//       const title = $dt.text().trim()
//       const links: string[] = []

//       $dt.find('a').each((_, aElement) => {
//         const href = $(aElement).attr('href')
//         if (href) {
//           links.push(href)
//         }
//       })

//       if (title && links.length > 0) {
//         bookmarks[title] = { links }
//       }
//     })
//   })

//   return bookmarks
// }

function extractLinksFromDlDt(htmlContent: string, limitPerBookmark: number): Record<string, { links: string[] }> {
  const $ = cheerio.load(htmlContent)
  const bookmarks: Record<string, { links: string[] }> = {}

  $('dl').each((_, dlElement) => {
    const $dl = $(dlElement)
    const title = $dl.find('dt').text().trim() // Get title from <dt>

    if (!title)
      return // Skip if title is empty

    const links: string[] = []

    $dl.find('dt a').each((_, aElement) => {
      if (links.length >= limitPerBookmark)
        return // Exit loop if limit is reached
      const href = $(aElement).attr('href')
      if (href) {
        links.push(href)
      }
    })

    if (links.length > 0) {
      bookmarks[title] = { links }
    }
  })

  return bookmarks
}

export async function getDocument(ctx: Context, limitPerBookmark: number = 1) {
  const file = await ctx.getFile() // valid for at least 1 hour

  if (!file) {
    throw new Error('No file received from Telegram')
  }

  const downloadLink = `https://api.telegram.org/file/bot${config.BOT_TOKEN}/${file.file_path}`
  console.log(downloadLink)
  const response = await axios.get(downloadLink, {
    responseType: 'arraybuffer',
  })

  const htmlContent = arrayBufferToString(response.data)
  const bookmarks = extractLinksFromDlDt(htmlContent, limitPerBookmark)
  const bookmarksJson = JSON.stringify(bookmarks, null, 2)
  // Extract the first bookmark's JSON string
  const firstBookmark = Object.values(bookmarksJson)[0] // Get the first bookmark object
  if (!firstBookmark) {
    throw new Error('No bookmarks found')
  }
  const firstBookmarkJson = JSON.stringify(firstBookmark, null, 2)

  // Reply with the first bookmark's JSON string
  // Save JSON to a file
  const filePath = './extracted_bookmarks.json'
  fs.writeFileSync(filePath, bookmarksJson, 'utf8')
  return await ctx.reply(firstBookmarkJson)
}
