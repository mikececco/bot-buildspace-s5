#!/usr/bin/env tsx

import process from 'node:process'
import { createBot } from '#root/bot/index.js'
import { config } from '#root/config.js'
import { logger } from '#root/logger.js'
import { createServer, createServerManager } from '#root/server/index.js'
import { prisma } from '#root/prisma/index.js'

try {
  const bot = createBot(config.BOT_TOKEN, {
    prisma,
  })
  const server = await createServer(bot)

  // graceful shutdown
  onShutdown(async () => {
    logger.info('Shutdown')

    await bot.stop()
  })

  await prisma.$connect()

  if (config.BOT_MODE === 'webhook') {
    // to prevent receiving updates before the bot is ready
    await bot.init()

    // start server
    serve(
      {
        fetch: server.fetch,
        hostname: config.BOT_SERVER_HOST,
        port: config.BOT_SERVER_PORT,
      },
      (info) => {
        const url
        = info.family === 'IPv6'
          ? `http://[${info.address}]:${info.port}`
          : `http://${info.address}:${info.port}`

        logger.info({
          msg: 'Server started',
          url,
        })
      },
    )

    // set webhook
    // await bot.api.setWebhook(config.BOT_WEBHOOK, {
    //   allowed_updates: config.BOT_ALLOWED_UPDATES,
    //   secret_token: config.BOT_WEBHOOK_SECRET,
    // })
    // logger.info({
    //   msg: 'Webhook was set',
    //   url: config.BOT_WEBHOOK,
    // })
  }
  else if (config.BOT_MODE === 'polling') {
    await bot.start({
      allowed_updates: config.BOT_ALLOWED_UPDATES,
      onStart: ({ username }) =>
        logger.info({
          msg: 'Bot running...',
          username,
        }),
    })
  }
}
catch (error) {
  logger.error(error)
  process.exit(1)
}
