import 'dotenv/config'
import fastify from 'fastify'
import { transactionsRoutes } from './routes/transactions'
import cookie from '@fastify/cookie'
import { env } from './env'

const app = fastify()
app.register(cookie)

app
  .register(transactionsRoutes, {
    prefix: 'transactions',
  })
  .listen({
    port: env.PORT,
  })
  .then(() => {
    console.log('HTTP Server Running!')
  })
