import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { knex } from '../database'
import { randomUUID } from 'crypto'
import { checkSessionId } from '../middleware/middleware'

export async function transactionsRoutes(app: FastifyInstance) {
  app.get(
    '/',
    {
      preHandler: [checkSessionId],
    },
    async (request) => {
      const { sessionId } = request.cookies

      const transactions = await knex('transactions')
        .where('session_id', sessionId)
        .select()
      return { transactions }
    },
  )

  app.get(
    '/:id',
    {
      preHandler: [checkSessionId],
    },
    async (request) => {
      const { sessionId } = request.cookies
      const getTransactionParams = z.object({
        id: z.string().uuid(),
      })
      const { id } = getTransactionParams.parse(request.params)

      const transaction = await knex('transactions')
        .where({ id, session_id: sessionId })
        .first()
      return { transaction }
    },
  )

  app.get(
    '/summary',
    {
      preHandler: [checkSessionId],
    },
    async (request) => {
      const { sessionId } = request.cookies
      const summary = await knex('transactions')
        .sum('amount', { as: 'amount' })
        .where('session_id', sessionId)
      return { summary }
    },
  )

  app.post('/', async (request, reply) => {
    const createTransactionBody = z.object({
      title: z.string(),
      amount: z.number(),
      type: z.enum(['credit', 'debit']),
    })

    const { title, amount, type } = createTransactionBody.parse(request.body)

    let sessionId = request.cookies.sessionId
    if (!sessionId) {
      sessionId = randomUUID()
      reply.cookie('sessionId', sessionId, {
        path: '/',
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
      })
    }

    await knex('transactions').insert({
      id: randomUUID(),
      title,
      amount: type === 'credit' ? amount : amount * -1,
      session_id: sessionId,
    })
    return reply.status(201).send()
  })
}
