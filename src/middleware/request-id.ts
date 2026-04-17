import type { MiddlewareHandler } from 'hono'

export const requestIdMiddleware: MiddlewareHandler = async (c, next) => {
  const id = crypto.randomUUID()
  c.set('requestId', id)
  c.header('X-Request-Id', id)
  await next()
}
