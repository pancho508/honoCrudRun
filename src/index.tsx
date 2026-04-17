import { serve } from '@hono/node-server'
import { bodyLimit } from 'hono/body-limit'
import { Hono } from 'hono'
import { logger } from 'hono/logger'
import type { AppVariables } from './types.js'
import { boardsApp } from './routes/boards.js'
import { threadsApp } from './routes/threads.js'
import { requestIdMiddleware } from './middleware/request-id.js'
import { securityHeadersMiddleware } from './middleware/security-headers.js'

type AppEnv = {
  Variables: AppVariables
}

const app = new Hono<AppEnv>()

// Middleware order matters in Hono: first registered middleware runs first.
app.use('*', logger())
app.use('*', requestIdMiddleware)
app.use('*', bodyLimit({ maxSize: 1024 * 40 }))
app.use('*', securityHeadersMiddleware)

app.get('/healthz', (c) => {
  return c.json({
    ok: true,
    requestId: c.get('requestId')
  })
})

// Sub-apps keep route modules focused and composable.
app.route('/thread', threadsApp)
app.route('/', boardsApp)

const port = Number(process.env.PORT ?? 3000)

serve(
  {
    fetch: app.fetch,
    port
  },
  (info) => {
    console.log(`Imageboard MVP listening on http://localhost:${info.port}`)
  }
)
