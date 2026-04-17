import { Hono } from 'hono'
import { z } from 'zod'
import { createThread, findBoardBySlug, listBoards, listThreadsByBoard } from '../db/repository.js'
import { Layout } from '../views/layout.js'

const createThreadSchema = z.object({
  name: z.string().trim().max(40).optional(),
  subject: z.string().trim().max(120).optional(),
  body: z.string().trim().min(3, 'Message must be at least 3 characters.').max(4000)
})

type ThreadFormInput = {
  name?: string
  subject?: string
  body?: string
}

const boardNotFound = (boardSlug: string) => (
  <Layout title="Board not found">
    <section class="card">
      <h2>Board not found</h2>
      <p>The board <code>/{boardSlug}/</code> does not exist.</p>
      <p><a href="/">Back to board index</a></p>
    </section>
  </Layout>
)

const renderBoardPage = ({
  boardSlug,
  formError,
  formInput
}: {
  boardSlug: string
  formError?: string
  formInput?: ThreadFormInput
}) => {
  const board = findBoardBySlug(boardSlug)

  if (!board) {
    return {
      status: 404,
      html: boardNotFound(boardSlug)
    }
  }

  const threads = listThreadsByBoard(board.id)

  return {
    status: 200,
    html: (
      <Layout title={`/${board.slug}/ - ${board.title}`}>
        <h2>/{board.slug}/ - {board.title}</h2>
        <p>{board.description}</p>

        <section class="card">
          <h3>Create Thread</h3>
          {formError ? <p class="meta" style="color:#8a1c1c;">{formError}</p> : null}
          <form method="post" action={`/${board.slug}/threads`}>
            <label>
              Name (optional)
              <input type="text" name="name" maxLength={40} value={formInput?.name ?? ''} />
            </label>
            <label>
              Subject (optional)
              <input type="text" name="subject" maxLength={120} value={formInput?.subject ?? ''} />
            </label>
            <label>
              Message
              <textarea name="body" required minLength={3} maxLength={4000}>{formInput?.body ?? ''}</textarea>
            </label>
            <button type="submit">Create Thread</button>
          </form>
        </section>

        <section>
          <h3>Threads</h3>
          {threads.length === 0 ? <p class="card">No threads yet. Start the first one.</p> : null}
          {threads.map((thread) => (
            <article class="card" key={thread.id}>
              <h4>
                <a href={`/thread/${thread.id}`}>
                  {thread.subject ?? `Thread #${thread.id}`}
                </a>
              </h4>
              <p class="meta">
                #{thread.id} • {thread.name || 'Anonymous'} • Created: {new Date(thread.created_at).toLocaleString()} • Bumped: {new Date(thread.bumped_at).toLocaleString()} • Replies: {thread.reply_count}
              </p>
              <pre>{thread.body.length > 350 ? `${thread.body.slice(0, 350)}...` : thread.body}</pre>
            </article>
          ))}
        </section>
      </Layout>
    )
  }
}

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
  const page = renderBoardPage({ boardSlug: c.req.param('boardSlug') })
  return c.html(page.html, page.status)
})

boardsApp.post('/:boardSlug{[a-z0-9]+}/threads', async (c) => {
  const boardSlug = c.req.param('boardSlug')

  let formData: FormData
  try {
    formData = await c.req.formData()
  } catch {
    const page = renderBoardPage({
      boardSlug,
      formError: 'Invalid form encoding. Please submit again.'
    })
    return c.html(page.html, page.status === 404 ? 404 : 400)
  }

  const input = {
    name: typeof formData.get('name') === 'string' ? (formData.get('name') as string) : undefined,
    subject: typeof formData.get('subject') === 'string' ? (formData.get('subject') as string) : undefined,
    body: typeof formData.get('body') === 'string' ? (formData.get('body') as string) : undefined
  }

  const parsed = createThreadSchema.safeParse(input)

  if (!parsed.success) {
    const page = renderBoardPage({
      boardSlug,
      formError: parsed.error.issues[0]?.message ?? 'Invalid thread submission.',
      formInput: input
    })
    return c.html(page.html, page.status === 404 ? 404 : 422)
  }

  const board = findBoardBySlug(boardSlug)
  if (!board) {
    return c.html(boardNotFound(boardSlug), 404)
  }

  createThread(board.id, parsed.data.name || null, parsed.data.subject || null, parsed.data.body)
  return c.redirect(`/${board.slug}`, 303)
})
