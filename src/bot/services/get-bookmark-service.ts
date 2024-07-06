import * as fs from 'node:fs'
import axios from 'axios'
import * as cheerio from 'cheerio'
import type { Context } from '#root/bot/context.js'
import { config } from '#root/config.js'
import type { CreateBookmarkInput, CreateBookmarkWithFolderInput } from '#root/prisma/bookmark.js'
// import { getLinkContent } from '#root/bot/services/get-link-content-service.js'
// import { createBookmarkContext } from '#root/bot/services/create-bookmark-context.js'

function arrayBufferToString(buffer: ArrayBuffer): string {
  return new TextDecoder().decode(buffer)
}

interface Bookmark {
  folder: string
  url: string
  name: string
}

function extractLinksFromDlDt(htmlContent: string): Bookmark[] {
  const $ = cheerio.load(htmlContent)
  const bookmarks: Bookmark[] = []
  let currentFolder: string | null = null

  $('h3, a').each((_, element) => {
    if (element.tagName === 'h3') {
      currentFolder = $(element).text()
    }
    else if (element.tagName === 'a' && currentFolder) {
      const url = $(element).attr('href')
      const name = $(element).text()
      if (url) {
        bookmarks.push({ folder: currentFolder, url, name })
      }
    }
  })

  return bookmarks
}

export async function getDocument(ctx: Context) {
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
  const links = extractLinksFromDlDt(htmlContent)
  // Save each bookmark
  let count = 0
  const bookmarksList: CreateBookmarkWithFolderInput[] = []
  if (ctx.from) {
    for (const link of links) {
      // const linkContent = await getLinkContent(link.url)
      const bookmarkData: CreateBookmarkWithFolderInput = {
        telegramId: ctx.from.id,
        username: ctx.from.username || 'username',
        content: '',
        link: link.url,
        name: link.name,
        folder: link.folder,
      }
      console.log(bookmarkData)
      count += 1
      bookmarksList.push(bookmarkData)
    }
  }

  return { count, bookmarksList }
}
