export async function getTranscript(operation: any, ctx: any) {
  try {
    // Get a Promise representation of the final result of the job.
    const [response] = await operation.promise()

    if (response.results) {
      const transcription = response.results
        .map((result: any) => result.alternatives?.[0]?.transcript)
        .join('\n')

      await ctx.reply(transcription)
    }
  }
  catch (error) {
    console.error('Error processing long-running operation:', error)
    // Handle error appropriately
  }
}
