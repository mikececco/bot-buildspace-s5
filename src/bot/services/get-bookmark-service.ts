import * as fs from 'node:fs'
import axios from 'axios'
import * as cheerio from 'cheerio'
import type { Context } from '#root/bot/context.js'
import { config } from '#root/config.js'
import { saveBookmark } from '#root/prisma/bookmark.js'
import type { CreateBookmarkInput } from '#root/prisma/bookmark.js'
import { getLinkContent } from '#root/bot/services/get-link-content-service.js'
import { createBookmarkContext } from '#root/bot/services/create-bookmark-context.js'

function arrayBufferToString(buffer: ArrayBuffer): string {
  return new TextDecoder().decode(buffer)
}

interface Link {
  url: string
  title: string
}

interface Bookmark {
  links: Link[]
}

function extractLinksFromDlDt(htmlContent: string, limitPerBookmark: number): Record<string, Bookmark> {
  const $ = cheerio.load(htmlContent)
  const bookmarks: Record<string, Bookmark> = {}

  function parseDl($dl: cheerio.Cheerio<cheerio.Element>, parentFolderName = '') {
    $dl.children('dt').each((_: number, dtElement: cheerio.Element) => {
      const $dt = $(dtElement)
      const $a = $dt.children('a')
      const $h3 = $dt.children('h3')

      if ($h3.length) {
        const folderName = $h3.text().trim()
        const newFolderName = parentFolderName ? `${parentFolderName}/${folderName}` : folderName
        const $nestedDl = $dt.next('dl')
        if ($nestedDl.length) {
          parseDl($nestedDl, newFolderName)
        }
      }
      else if ($a.length) {
        const href = $a.attr('href') ?? ''
        const title = $a.text().trim()
        const folderName = parentFolderName || 'Bookmarks'

        if (!bookmarks[folderName]) {
          bookmarks[folderName] = { links: [] }
        }

        if (bookmarks[folderName].links.length < limitPerBookmark) {
          bookmarks[folderName].links.push({ url: href, title })
        }
      }
    })
  }

  $('dl').each((_, dlElement) => {
    parseDl($(dlElement))
  })

  return bookmarks
}

export async function getDocument(ctx: Context, limitPerBookmark: number = 15) {
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

  // Save each bookmark
  if (ctx.from) {
    for (const [list, { links }] of Object.entries(bookmarks)) {
      for (const link of links) {
        const bookmarkData: CreateBookmarkInput = {
          telegramId: ctx.from.id,
          username: ctx.from.username || 'username',
          list,
          link: link.url, // Ensure link.url is used instead of link
        }
        // await ctx.reply(' List of bookmarks: ')
        console.log(`${bookmarkData.list}, ${bookmarkData.link}`)

        const linkContent = await getLinkContent(link.url)

        await createBookmarkContext(ctx, bookmarkData, linkContent)
      }
    }
  }

  // Extract the first bookmark's JSON string
  const firstBookmark = Object.values(bookmarks)[0] // Get the first bookmark object
  if (!firstBookmark) {
    throw new Error('No bookmarks found')
  }
  // const firstBookmarkJson = JSON.stringify(firstBookmark, null, 2)

  // Reply with the first bookmark's JSON string
  // Save JSON to a file
  const filePath = './extracted_bookmarks.json'
  return fs.writeFileSync(filePath, bookmarksJson, 'utf8')
  // return await ctx.reply(firstBookmarkJson)
}
