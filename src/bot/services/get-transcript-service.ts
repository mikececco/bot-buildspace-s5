import { Inngest } from 'inngest'

export const inngest = new Inngest({ id: 'bot-buildspace-s5' })

export const getTranscript = inngest.createFunction(
  { id: 'get-transcript' },
  { event: 'app/long-running-recognition.completed' }, // Assuming this event triggers after long-running recognition completes
  async ({ event, step }) => {
    const client = event.data.client // Assuming client is passed in event data
    const request = event.data.request // Assuming request is passed in event data
    const ctx = event.data.ctx // Assuming ctx is passed in event data

    const [operation] = await client.longRunningRecognize(request)
    const [response] = await operation.promise()

    console.log(step)

    if (response.results) {
      const transcription = response.results
        .map((result: any) => result.alternatives?.[0]?.transcript) // Explicitly specify 'result' as 'any'
        .join('\n')

      await ctx.reply(transcription)
    }
  },
)
