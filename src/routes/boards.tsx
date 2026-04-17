import { Hono } from 'hono'
import { z } from 'zod'
import { createThread, findBoardBySlug, listBoards, listThreadsByBoard } from '../db/repository.js'
import { Layout } from '../views/layout.js'

const createThreadSchema = z.object({
  subject: z.string().trim().max(120).optional(),
  body: z.string().trim().min(1).max(4000)
})

export const boardsApp = new Hono()

boardsApp.get('/', (c) => {
  const boards = listBoards()

  return c.html(
    <Layout title="Boards">
      <h2>Boards</h2>
      <div>
        {boards.map((board) => (
          <article class="card" key={board.id}>
            <h3><a href={`/${board.slug}`}>/{board.slug}/ - {board.title}</a></h3>
            <p>{board.description}</p>
          </article>
        ))}
      </div>
    </Layout>
  )
})

boardsApp.get('/:boardSlug{[a-z0-9]+}', (c) => {
  const boardSlug = c.req.param('boardSlug')
  const board = findBoardBySlug(boardSlug)

  if (!board) {
    return c.text('Board not found', 404)
  }

  const threads = listThreadsByBoard(board.id)

  return c.html(
    <Layout title={`/${board.slug}/ - ${board.title}`}>
      <h2>/{board.slug}/ - {board.title}</h2>
      <p>{board.description}</p>

      <section class="card">
        <h3>Create Thread</h3>
        <form method="post" action={`/${board.slug}/threads`}>
          <label>
            Subject (optional)
            <input type="text" name="subject" maxLength={120} />
          </label>
          <label>
            Message
            <textarea name="body" required minLength={1} maxLength={4000}></textarea>
          </label>
          <button type="submit">Create Thread</button>
        </form>
      </section>

      <section>
        <h3>Threads</h3>
        {threads.length === 0 ? <p>No threads yet.</p> : null}
        {threads.map((thread) => (
          <article class="card" key={thread.id}>
            <h4>
              <a href={`/thread/${thread.id}`}>
                {thread.subject ?? `Thread #${thread.id}`}
              </a>
            </h4>
            <p class="meta">
              OP: {new Date(thread.created_at).toLocaleString()} • Bumped: {new Date(thread.bumped_at).toLocaleString()} • Replies: {thread.reply_count}
            </p>
            <pre>{thread.body.length > 350 ? `${thread.body.slice(0, 350)}...` : thread.body}</pre>
          </article>
        ))}
      </section>
    </Layout>
  )
})

boardsApp.post('/:boardSlug{[a-z0-9]+}/threads', async (c) => {
  const boardSlug = c.req.param('boardSlug')
  const board = findBoardBySlug(boardSlug)

  if (!board) {
    return c.text('Board not found', 404)
  }

  const formData = await c.req.formData()
  const subject = formData.get('subject')
  const body = formData.get('body')

  const parsed = createThreadSchema.safeParse({
    subject: typeof subject === 'string' ? subject : undefined,
    body: typeof body === 'string' ? body : ''
  })

  if (!parsed.success) {
    return c.text('Invalid thread submission', 400)
  }

  createThread(board.id, parsed.data.subject || null, parsed.data.body)
  return c.redirect(`/${board.slug}`, 303)
})
