import { db } from './client.js'

export type Board = {
  id: number
  slug: string
  title: string
  description: string
  created_at: string
}

export type ThreadSummary = {
  id: number
  name: string | null
  subject: string | null
  body: string
  created_at: string
  bumped_at: string
  pinned: number
  locked: number
  reply_count: number
}

export type ThreadDetail = {
  id: number
  board_id: number
  board_slug: string
  board_title: string
  name: string | null
  subject: string | null
  body: string
  created_at: string
  pinned: number
  locked: number
}

export type Reply = {
  id: number
  thread_id: number
  name: string | null
  body: string
  created_at: string
}

export const listBoards = (): Board[] =>
  db.prepare('SELECT * FROM boards ORDER BY slug ASC').all() as Board[]

export const findBoardBySlug = (slug: string): Board | undefined =>
  db.prepare('SELECT * FROM boards WHERE slug = ?').get(slug) as Board | undefined

export const listThreadsByBoard = (boardId: number): ThreadSummary[] =>
  db
    .prepare(
      `SELECT t.id, t.name, t.subject, t.body, t.created_at, t.bumped_at, t.pinned, t.locked,
              COUNT(p.id) as reply_count
         FROM threads t
         LEFT JOIN posts p ON p.thread_id = t.id
        WHERE t.board_id = ?
        GROUP BY t.id
        ORDER BY t.pinned DESC, t.bumped_at DESC, t.id DESC`
    )
    .all(boardId) as ThreadSummary[]

export const createThread = (
  boardId: number,
  name: string | null,
  subject: string | null,
  body: string
): number => {
  const result = db
    .prepare('INSERT INTO threads (board_id, name, subject, body) VALUES (?, ?, ?, ?)')
    .run(boardId, name, subject, body)
  return Number(result.lastInsertRowid)
}

export const findThreadDetail = (threadId: number): ThreadDetail | undefined =>
  db
    .prepare(
      `SELECT t.id, t.board_id, b.slug as board_slug, b.title as board_title,
              t.name, t.subject, t.body, t.created_at, t.pinned, t.locked
         FROM threads t
         JOIN boards b on b.id = t.board_id
        WHERE t.id = ?`
    )
    .get(threadId) as ThreadDetail | undefined

export const listRepliesByThread = (threadId: number): Reply[] =>
  db
    .prepare('SELECT id, thread_id, name, body, created_at FROM posts WHERE thread_id = ? ORDER BY id ASC')
    .all(threadId) as Reply[]

export const createReply = (threadId: number, name: string | null, body: string): number => {
  const insertReply = db.prepare('INSERT INTO posts (thread_id, name, body) VALUES (?, ?, ?)')
  const bumpThread = db.prepare('UPDATE threads SET bumped_at = CURRENT_TIMESTAMP WHERE id = ? AND locked = 0')
  const tx = db.transaction((id: number, replyName: string | null, replyBody: string) => {
    const lockedThread = db.prepare('SELECT id FROM threads WHERE id = ? AND locked = 1').get(id)
    if (lockedThread) {
      throw new Error('THREAD_LOCKED')
    }

    const replyRes = insertReply.run(id, replyName, replyBody)
    bumpThread.run(id)
    return Number(replyRes.lastInsertRowid)
  })

  return tx(threadId, name, body)
}
