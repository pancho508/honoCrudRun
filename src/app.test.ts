import { beforeEach, test } from 'node:test'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'

process.env.DB_PATH = `/tmp/imageboard-test-${randomUUID()}.sqlite`

const { createApp } = await import('./index.js')
const { db } = await import('./db/client.js')

const app = createApp()

beforeEach(() => {
  db.exec('DELETE FROM posts; DELETE FROM threads;')
})

test('homepage loads and lists seeded boards', async () => {
  const res = await app.request('/')
  assert.equal(res.status, 200)
  const html = await res.text()
  assert.match(html, /\/b\//)
  assert.match(html, /\/tech\//)
})

test('board not found returns friendly 404 page', async () => {
  const res = await app.request('/missing')
  assert.equal(res.status, 404)
  const html = await res.text()
  assert.match(html, /Board not found/)
})

test('create thread validation failure returns 422 and message', async () => {
  const body = new URLSearchParams({ body: 'x' })
  const res = await app.request('/b/threads', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body
  })

  assert.equal(res.status, 422)
  const html = await res.text()
  assert.match(html, /at least 3 characters/)
})

test('thread page shows escaped content', async () => {
  const createRes = await app.request('/b/threads', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ body: '<script>alert(1)</script>' })
  })

  assert.equal(createRes.status, 303)

  const boardRes = await app.request('/b')
  const boardHtml = await boardRes.text()
  const match = boardHtml.match(/\/thread\/(\d+)/)
  assert.ok(match)

  const threadRes = await app.request(`/thread/${match[1]}`)
  const threadHtml = await threadRes.text()
  assert.doesNotMatch(threadHtml, /<script>alert\(1\)<\/script>/)
  assert.match(threadHtml, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/)
})
