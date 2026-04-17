import { Hono } from 'hono'
import { z } from 'zod'
import { createReply, findThreadDetail, listRepliesByThread } from '../db/repository.js'
import { Layout } from '../views/layout.js'

const replySchema = z.object({
  body: z.string().trim().min(1).max(2000)
})

export const threadsApp = new Hono()

threadsApp.get('/:threadId{[0-9]+}', (c) => {
  const threadId = Number(c.req.param('threadId'))
  const thread = findThreadDetail(threadId)

  if (!thread) {
    return c.text('Thread not found', 404)
  }

  const replies = listRepliesByThread(threadId)

  return c.html(
    <Layout title={`/${thread.board_slug}/ - ${thread.subject ?? `Thread #${thread.id}`}`}>
      <nav><a href={`/${thread.board_slug}`}>← Back to /{thread.board_slug}/</a></nav>
      <article class="card">
        <h2>{thread.subject ?? `Thread #${thread.id}`}</h2>
        <p class="meta">OP • {new Date(thread.created_at).toLocaleString()}</p>
        <pre>{thread.body}</pre>
      </article>

      <section>
        <h3>Replies ({replies.length})</h3>
        {replies.map((reply) => (
          <article class="card" key={reply.id}>
            <p class="meta">Reply #{reply.id} • {new Date(reply.created_at).toLocaleString()}</p>
            <pre>{reply.body}</pre>
          </article>
        ))}
      </section>

      <section class="card">
        <h3>Add Reply</h3>
        <form method="post" action={`/thread/${thread.id}/replies`}>
          <label>
            Message
            <textarea name="body" required minLength={1} maxLength={2000}></textarea>
          </label>
          <button type="submit">Post Reply</button>
        </form>
      </section>
    </Layout>
  )
})

threadsApp.post('/:threadId{[0-9]+}/replies', async (c) => {
  const threadId = Number(c.req.param('threadId'))
  const thread = findThreadDetail(threadId)

  if (!thread) {
    return c.text('Thread not found', 404)
  }

  const formData = await c.req.formData()
  const body = formData.get('body')

  const parsed = replySchema.safeParse({
    body: typeof body === 'string' ? body : ''
  })

  if (!parsed.success) {
    return c.text('Invalid reply body', 400)
  }

  createReply(threadId, parsed.data.body)
  return c.redirect(`/thread/${threadId}`, 303)
})
