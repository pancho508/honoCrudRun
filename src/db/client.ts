import Database from 'better-sqlite3'

export const db = new Database('imageboard.sqlite')
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
    subject TEXT,
    body TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    bumped_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(board_id) REFERENCES boards(id)
  );

  CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    thread_id INTEGER NOT NULL,
    body TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(thread_id) REFERENCES threads(id)
  );
`)

const countBoards = db.prepare('SELECT COUNT(*) as count FROM boards').get() as { count: number }

if (countBoards.count === 0) {
  const insertBoard = db.prepare(
    'INSERT INTO boards (slug, title, description) VALUES (?, ?, ?)'
  )
  insertBoard.run('b', 'Random', 'Anything goes.')
  insertBoard.run('tech', 'Technology', 'Programming, hardware, and software.')
  insertBoard.run('art', 'Art', 'Drawings, paintings, and design.')
}
