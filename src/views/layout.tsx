import type { Child } from 'hono/jsx'

type LayoutProps = {
  title: string
  children: Child
}

export const Layout = ({ title, children }: LayoutProps) => {
  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{title}</title>
        <style>{`
          body { font-family: sans-serif; max-width: 900px; margin: 2rem auto; padding: 0 1rem; line-height: 1.4; }
          a { color: #0b57d0; text-decoration: none; }
          a:hover { text-decoration: underline; }
          .card { border: 1px solid #ddd; border-radius: 8px; padding: 1rem; margin-bottom: 1rem; }
          textarea, input { width: 100%; margin-top: 0.25rem; margin-bottom: 0.75rem; }
          textarea { min-height: 110px; }
          button { padding: 0.5rem 0.8rem; }
          .meta { color: #666; font-size: 0.9rem; }
        `}</style>
      </head>
      <body>
        <header>
          <h1><a href="/">Hono Imageboard MVP</a></h1>
          <p class="meta">Anonymous posting, server-rendered HTML, SQLite.</p>
          <hr />
        </header>
        <main>{children}</main>
      </body>
    </html>
  )
}
