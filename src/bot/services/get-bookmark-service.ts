import * as fs from 'node:fs'
import axios from 'axios'
import * as cheerio from 'cheerio'
import type { Context } from '#root/bot/context.js'
import { config } from '#root/config.js'
import type { CreateBookmarkInput, CreateBookmarkWithFolderInput } from '#root/prisma/bookmark.js'
import { getLinkContent } from '#root/bot/services/get-link-content-service.js'
// import { createBookmarkContext } from '#root/bot/services/create-bookmark-context.js'
import { saveBookmarks } from '#root/prisma/bookmark.js'
import { categorizeWithGoogleCloud } from '#root/bot/services/categorize-service.js'

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
      const bookmarkData: CreateBookmarkWithFolderInput = {
        telegramId: ctx.from.id,
        username: ctx.from.username || 'username',
        content: '',
        tags: '',
        link: link.url,
        name: link.name,
        folder: link.folder,
      }
      console.log(bookmarkData)
      count += 1
      bookmarksList.push(bookmarkData)
    }
  }

  fetchLinkContentInBackground(links, bookmarksList)

  return count
}

function fetchLinkContentInBackground(links: any[], bookmarksList: CreateBookmarkWithFolderInput[]): Promise<void> {
  // Map each link to a promise that fetches its content
  const fetchPromises = links.map((link) => {
    const index = bookmarksList.findIndex(b => b.link === link.url)
    return getLinkContent(link.url)
      .then((content) => {
        if (index !== -1) {
          bookmarksList[index].content = content
        }
        return categorizeWithGoogleCloud(link.url)
          .then((tags) => {
            if (index !== -1) {
              bookmarksList[index].tags = tags
            }
          })
          .catch((error) => {
            console.error('Error categorizing content:', error)
            throw error // Propagate the error if necessary
          })
      })
      .catch((error) => {
        console.error(`Failed to fetch content for ${link.url}: ${error.message}`)
        // Optionally handle the error or propagate it further
      })
  })

  // Wait for all fetch promises to complete
  return Promise.all(fetchPromises)
    .then(() => {
      // After all content fetching is complete, save bookmarksList
      return saveBookmarks(bookmarksList)
    })
    .then(() => {
      console.log('Bookmarks saved successfully.')
    })
    .catch((error) => {
      console.error('Error in fetchLinkContentInBackground:', error)
      // Handle the error gracefully, possibly propagate it further
      throw error // Propagate the error if necessary
    })
    .finally(() => {
      console.log('Content fetching and saving completed.')
    })
}
