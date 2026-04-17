import { Hono } from 'hono'
import { z } from 'zod'
import { createReply, findThreadDetail, listRepliesByThread } from '../db/repository.js'
import { Layout } from '../views/layout.js'

const replySchema = z.object({
  name: z.string().trim().max(40).optional(),
  body: z.string().trim().min(2, 'Reply must be at least 2 characters.').max(2000)
})

type ReplyFormInput = {
  name?: string
  body?: string
}

const threadNotFoundPage = (threadId: number) => (
  <Layout title="Thread not found">
    <section class="card">
      <h2>Thread not found</h2>
      <p>No thread exists for ID <code>{threadId}</code>.</p>
      <p><a href="/">Back to boards</a></p>
    </section>
  </Layout>
)

const renderThreadPage = ({
  threadId,
  formError,
  formInput
}: {
  threadId: number
  formError?: string
  formInput?: ReplyFormInput
}) => {
  const thread = findThreadDetail(threadId)

  if (!thread) {
    return {
      status: 404,
      html: threadNotFoundPage(threadId)
    }
  }

  const replies = listRepliesByThread(threadId)

  return {
    status: 200,
    html: (
      <Layout title={`/${thread.board_slug}/ - ${thread.subject ?? `Thread #${thread.id}`}`}>
        <nav><a href={`/${thread.board_slug}`}>{`← Back to /${thread.board_slug}/`}</a></nav>
        <article class="card">
          <h2>{thread.subject ?? `Thread #${thread.id}`}</h2>
          <p class="meta">#{thread.id} • {thread.name || 'Anonymous'} • OP • {new Date(thread.created_at).toLocaleString()}</p>
          <pre>{thread.body}</pre>
        </article>

        <section>
          <h3>Replies ({replies.length})</h3>
          {replies.length === 0 ? <p class="card">No replies yet.</p> : null}
          {replies.map((reply) => (
            <article class="card" key={reply.id}>
              <p class="meta">Reply #{reply.id} • {reply.name || 'Anonymous'} • {new Date(reply.created_at).toLocaleString()}</p>
              <pre>{reply.body}</pre>
            </article>
          ))}
        </section>

        {thread.locked ? (
          <section class="card">
            <h3>Thread locked</h3>
            <p class="meta">This thread is locked and no longer accepts replies.</p>
          </section>
        ) : (
          <section class="card">
            <h3>Add Reply</h3>
            {formError ? <p class="meta" style="color:#8a1c1c;">{formError}</p> : null}
            <form method="post" action={`/thread/${thread.id}/replies`}>
              <label>
                Name (optional)
                <input type="text" name="name" maxLength={40} value={formInput?.name ?? ''} />
              </label>
              <label>
                Message
                <textarea name="body" required minLength={2} maxLength={2000}>{formInput?.body ?? ''}</textarea>
              </label>
              <button type="submit">Post Reply</button>
            </form>
          </section>
        )}
      </Layout>
    )
  }
}

export const threadsApp = new Hono()

threadsApp.get('/:threadId{[0-9]+}', (c) => {
  const page = renderThreadPage({ threadId: Number(c.req.param('threadId')) })
  return c.html(page.html, page.status)
})

threadsApp.post('/:threadId{[0-9]+}/replies', async (c) => {
  const threadId = Number(c.req.param('threadId'))

  let formData: FormData
  try {
    formData = await c.req.formData()
  } catch {
    const page = renderThreadPage({
      threadId,
      formError: 'Invalid form encoding. Please submit again.'
    })
    return c.html(page.html, page.status === 404 ? 404 : 400)
  }

  const input = {
    name: typeof formData.get('name') === 'string' ? (formData.get('name') as string) : undefined,
    body: typeof formData.get('body') === 'string' ? (formData.get('body') as string) : undefined
  }

  const parsed = replySchema.safeParse(input)

  if (!parsed.success) {
    const page = renderThreadPage({
      threadId,
      formError: parsed.error.issues[0]?.message ?? 'Invalid reply body.',
      formInput: input
    })
    return c.html(page.html, page.status === 404 ? 404 : 422)
  }

  const thread = findThreadDetail(threadId)
  if (!thread) {
    return c.html(threadNotFoundPage(threadId), 404)
  }

  try {
    createReply(threadId, parsed.data.name || null, parsed.data.body)
  } catch (error) {
    if (error instanceof Error && error.message === 'THREAD_LOCKED') {
      const page = renderThreadPage({
        threadId,
        formError: 'Thread is locked and cannot receive replies.'
      })
      return c.html(page.html, 409)
    }
    throw error
  }

  return c.redirect(`/thread/${threadId}`, 303)
})
