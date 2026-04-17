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
  subject: string | null
  body: string
  created_at: string
  bumped_at: string
  reply_count: number
}

export type ThreadDetail = {
  id: number
  board_id: number
  board_slug: string
  board_title: string
  subject: string | null
  body: string
  created_at: string
}

export type Reply = {
  id: number
  thread_id: number
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
      `SELECT t.id, t.subject, t.body, t.created_at, t.bumped_at,
              COUNT(p.id) as reply_count
         FROM threads t
         LEFT JOIN posts p ON p.thread_id = t.id
        WHERE t.board_id = ?
        GROUP BY t.id
        ORDER BY t.bumped_at DESC`
    )
    .all(boardId) as ThreadSummary[]

export const createThread = (boardId: number, subject: string | null, body: string): number => {
  const result = db
    .prepare('INSERT INTO threads (board_id, subject, body) VALUES (?, ?, ?)')
    .run(boardId, subject, body)
  return Number(result.lastInsertRowid)
}

export const findThreadDetail = (threadId: number): ThreadDetail | undefined =>
  db
    .prepare(
      `SELECT t.id, t.board_id, b.slug as board_slug, b.title as board_title,
              t.subject, t.body, t.created_at
         FROM threads t
         JOIN boards b on b.id = t.board_id
        WHERE t.id = ?`
    )
    .get(threadId) as ThreadDetail | undefined

export const listRepliesByThread = (threadId: number): Reply[] =>
  db
    .prepare('SELECT id, thread_id, body, created_at FROM posts WHERE thread_id = ? ORDER BY id ASC')
    .all(threadId) as Reply[]

export const createReply = (threadId: number, body: string): number => {
  const insertReply = db.prepare('INSERT INTO posts (thread_id, body) VALUES (?, ?)')
  const bumpThread = db.prepare('UPDATE threads SET bumped_at = CURRENT_TIMESTAMP WHERE id = ?')
  const tx = db.transaction((id: number, replyBody: string) => {
    const replyRes = insertReply.run(id, replyBody)
    bumpThread.run(id)
    return Number(replyRes.lastInsertRowid)
  })

  return tx(threadId, body)
}
