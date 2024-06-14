import { prisma } from '#root/prisma/index.js'

export async function createThoughtSummary(thoughtId: number, summaryId: number) {
  try {
    // Check if the summaryId exists in the Summary table
    const existingSummary = await prisma.summary.findUnique({
      where: { id: summaryId },
    })
    if (!existingSummary) {
      throw new Error(`Summary with id ${summaryId} does not exist.`)
    }

    // Create the ThoughtSummary
    const thoughtSummary = await prisma.thoughtSummary.create({
      data: {
        thoughtId,
        summaryId,
      },
    })

    return thoughtSummary
  }
  catch (error) {
    console.error('Error creating thought summary:', error)
    throw error
  }
}
