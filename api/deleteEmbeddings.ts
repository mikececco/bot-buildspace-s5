import process from 'node:process'
import * as pg from 'pg'

const { Pool } = pg.default

const connectionString = `${process.env.POSTGRES_URL}`

const pool = new Pool({
  connectionString,
  min: 0, // minimum number of clients in the pool
  max: 10, // maximum number of clients in the pool
})

export async function deleteEmbeddings() {
  try {
    // Perform deletion operation
    const result = await pool.query('DELETE FROM embeddings')

    console.log('Embeddings deleted successfully:', result.rowCount)
  }
  catch (error) {
    console.error('Error deleting embeddings:', error)
  }
  finally {
    await pool.end()
  }
}
