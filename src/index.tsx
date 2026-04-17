import { serve } from '@hono/node-server'
import { fileURLToPath } from 'node:url'
import { bodyLimit } from 'hono/body-limit'
import { Hono } from 'hono'
import { logger } from 'hono/logger'
import type { AppVariables } from './types.js'
import { boardsApp } from './routes/boards.js'
import { threadsApp } from './routes/threads.js'
import { requestIdMiddleware } from './middleware/request-id.js'
import { securityHeadersMiddleware } from './middleware/security-headers.js'
import { Layout } from './views/layout.js'

type AppEnv = {
  Variables: AppVariables
}

export const createApp = () => {
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

  app.notFound((c) => {
    return c.html(
      <Layout title="404 Not Found">
        <section class="card">
          <h2>404 — Page not found</h2>
          <p>The page you requested does not exist.</p>
          <p><a href="/">Go back to board index</a></p>
        </section>
      </Layout>,
      404
    )
  })

  app.onError((err, c) => {
    console.error('Unhandled error', err)
    return c.html(
      <Layout title="Server Error">
        <section class="card">
          <h2>500 — Server error</h2>
          <p>Something went wrong while processing your request.</p>
          <p>Request ID: <code>{c.get('requestId')}</code></p>
          <p><a href="/">Return home</a></p>
        </section>
      </Layout>,
      500
    )
  })

  return app
}

const isMainModule = process.argv[1] === fileURLToPath(import.meta.url)
if (isMainModule) {
  const app = createApp()
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
}
