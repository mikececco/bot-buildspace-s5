import { autoChatAction } from '@grammyjs/auto-chat-action'
import { hydrate } from '@grammyjs/hydrate'
import { hydrateReply, parseMode } from '@grammyjs/parse-mode'
import type { BotConfig } from 'grammy'
import { PrismaAdapter } from '@grammyjs/storage-prisma'
import { Bot as TelegramBot, session } from 'grammy'
import type {
  Context,
  SessionData,
} from '#root/bot/context.js'
import {
  createContextConstructor,
} from '#root/bot/context.js'
import {
  adminFeature,
  anyFeature,
  languageFeature,
  unhandledFeature,
  welcomeFeature,
} from '#root/bot/features/index.js'
import { errorHandler } from '#root/bot/handlers/index.js'
import { i18n, isMultipleLocales } from '#root/bot/i18n.js'
import { updateLogger } from '#root/bot/middlewares/index.js'
import { config } from '#root/config.js'
import { logger } from '#root/logger.js'
import type { PrismaClientX } from '#root/prisma/index.js'

interface Options {
  prisma: PrismaClientX
  config?: Omit<BotConfig<Context>, 'ContextConstructor'>
}

export function createBot(token: string, options: Options) {
  const { prisma } = options
  const bot = new TelegramBot(token, {
    ...options.config,
    ContextConstructor: createContextConstructor({ logger, prisma }),
  })
  const protectedBot = bot.errorBoundary(errorHandler)
  console.log('In creating BOT')

  // Middlewares
  bot.api.config.use(parseMode('HTML'))

  if (config.isDev)
    protectedBot.use(updateLogger())

  protectedBot.use(autoChatAction(bot.api))
  protectedBot.use(hydrateReply)
  protectedBot.use(hydrate())
  protectedBot.use(
    session({
      initial: () => ({ counter: 0 }),
      storage: new PrismaAdapter<SessionData>(prisma.session),
    }),
  )
  console.log('Created session')
  protectedBot.use(i18n)

  // Handlers
  protectedBot.use(welcomeFeature)
  protectedBot.use(anyFeature)
  protectedBot.use(adminFeature)
  console.log('Using features')

  if (isMultipleLocales)
    protectedBot.use(languageFeature)

  // must be the last handler
  protectedBot.use(unhandledFeature)

  console.log('Gonna return')
  return bot
}

export type Bot = ReturnType<typeof createBot>
