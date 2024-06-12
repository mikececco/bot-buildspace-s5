import { handle } from '@hono/node-server/vercel'
import { createBot } from '#root/bot/index.js'
import { config as configuration } from '#root/config.js'
import { createServer } from '#root/server/index.js'
import { prisma } from '#root/prisma/index.js'

const bot = createBot(configuration.BOT_TOKEN, {
  prisma,
})
const server = await createServer(bot)

export default handle(server)
