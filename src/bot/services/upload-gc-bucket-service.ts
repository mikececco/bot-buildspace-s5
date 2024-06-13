import { Readable, Stream } from 'node:stream'
// import path from 'node:path'
import { Buffer } from 'node:buffer'
import { Storage } from '@google-cloud/storage'
import fetch from 'node-fetch'
import { config } from '#root/config.js'
import type {
  Context,
} from '#root/bot/context.js'

const storage = new Storage()

const bucketName = 'buildspace-project-audios' // Replace with your GCS bucket name

export async function uploadFileToGCS(ctx: Context) {
  try {
    const file = await ctx.getFile() // Assuming ctx is your Telegram context object
    const path = file.file_path
    const fileUrl = `https://api.telegram.org/file/bot${config.BOT_TOKEN}/${path}` // IS THIS remote LINEAR16 file?

    const fetchedFile = await fetch(fileUrl)

    if (!fetchedFile.ok) {
      throw new Error(`Failed to fetch file from Telegram, status ${fetchedFile.status}`)
    }

    const myBucket = storage.bucket(bucketName)

    // SPECIFY MIME?
    const fileName = `test` // Replace with your desired file name

    // Create a reference to a file object
    const fileBucket = myBucket.file(fileName)

    // Read fetched content as Buffer
    const fileBuffer = await fetchedFile.arrayBuffer()
    const buffer = Buffer.from(fileBuffer)

    // Create a pass through stream from the Buffer
    const passthroughStream = new Stream.PassThrough()
    passthroughStream.end(buffer)

    // // Create a pass through stream from a string
    // const passthroughStream = new Stream.PassThrough()
    // passthroughStream.write(fetchedFile)
    // passthroughStream.end()

    passthroughStream.pipe(fileBucket.createWriteStream()).on('finish', () => {
      // The file upload is complete
    })

    console.log(`File uploaded to ${bucketName}`)
    // Return GCS URI
    const gcsUri = `gs://${bucketName}/${fileName}`
    return gcsUri
  }
  catch (error) {
    console.error('Error uploading file to GCS:', error)
    throw error
  }
}
