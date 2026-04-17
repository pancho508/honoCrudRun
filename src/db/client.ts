import Database from 'better-sqlite3'

const dbPath = process.env.DB_PATH || 'imageboard.sqlite'
export const db = new Database(dbPath)
db.pragma('journal_mode = WAL')

db.exec(`
  CREATE TABLE IF NOT EXISTS boards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS threads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    board_id INTEGER NOT NULL,
    name TEXT,
    subject TEXT,
    body TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    bumped_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    pinned INTEGER NOT NULL DEFAULT 0,
    locked INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY(board_id) REFERENCES boards(id)
  );

  CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    thread_id INTEGER NOT NULL,
    name TEXT,
    body TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(thread_id) REFERENCES threads(id)
  );
`)

const threadColumns = db.prepare('PRAGMA table_info(threads)').all() as Array<{ name: string }>
const postColumns = db.prepare('PRAGMA table_info(posts)').all() as Array<{ name: string }>

if (!threadColumns.some((c) => c.name === 'name')) {
  db.exec('ALTER TABLE threads ADD COLUMN name TEXT')
}
if (!threadColumns.some((c) => c.name === 'pinned')) {
  db.exec('ALTER TABLE threads ADD COLUMN pinned INTEGER NOT NULL DEFAULT 0')
}
if (!threadColumns.some((c) => c.name === 'locked')) {
  db.exec('ALTER TABLE threads ADD COLUMN locked INTEGER NOT NULL DEFAULT 0')
}
if (!postColumns.some((c) => c.name === 'name')) {
  db.exec('ALTER TABLE posts ADD COLUMN name TEXT')
}

const countBoards = db.prepare('SELECT COUNT(*) as count FROM boards').get() as { count: number }

if (countBoards.count === 0) {
  const insertBoard = db.prepare(
    'INSERT INTO boards (slug, title, description) VALUES (?, ?, ?)'
  )
  insertBoard.run('b', 'Random', 'Anything goes.')
  insertBoard.run('tech', 'Technology', 'Programming, hardware, and software.')
  insertBoard.run('art', 'Art', 'Drawings, paintings, and design.')
}
