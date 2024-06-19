export async function toArrayStrings(content: string, size?: number): Promise<string[]> {
  const chunkSize = size ?? 1000 // Default to 1000 if size is not provided
  const result: string[] = []
  for (let i = 0; i < content.length; i += chunkSize) {
    result.push(content.slice(i, i + chunkSize))
  }
  return result
}
