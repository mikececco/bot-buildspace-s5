import { Readable, Stream } from 'node:stream'
import { Buffer } from 'node:buffer'
import fs from 'node:fs'
import path from 'node:path'
import axios from 'axios'
import { Storage } from '@google-cloud/storage'
import { config } from '#root/config.js'
import type {
  Context,
} from '#root/bot/context.js'

const storage = new Storage()

const bucketName = 'buildspace-project-audios' // Replace with your GCS bucket name
const outputDir = './downloaded_audio' // You can specify any directory path here

// Ensure the directory exists, create it if it doesn't
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true })
}
const outputFilePath = path.join(outputDir, 'output_filename.ogg') // Replace 'output_filename.ogg' with the desired filename and extension

export async function uploadFileToGCS(ctx: Context, fileId: string) {
  try {
    const file = await ctx.getFile() // Assuming ctx is your Telegram context object
    const path = file.file_path
    const fileUrl = `https://api.telegram.org/file/bot${config.BOT_TOKEN}/${path}` // IS THIS remote LINEAR16 file?

    const responseFileUrl = await axios.get(fileUrl, {
      responseType: 'arraybuffer',
    })

    fs.writeFileSync(outputFilePath, Buffer.from(responseFileUrl.data))

    const myBucket = storage.bucket(bucketName)

    // SPECIFY MIME?
    const fileName = fileId // Replace with your desired file name

    // Create a reference to a file object
    const fileBucket = myBucket.file(fileName)

    // Create a pass through stream from the Buffer
    const passthroughStream = new Stream.PassThrough()
    passthroughStream.end(Buffer.from(responseFileUrl.data))

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
