import type { Server } from 'node:http'
import { createServer } from 'node:http'

/**
 * Create a simple HTTP server that returns canned JSON responses.
 * Used as toll-booth's upstream proxy target in integration tests.
 */
export function createMockUpstream(): { server: Server; start: () => Promise<string> } {
  const server = createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({
      path: req.url,
      method: req.method,
      message: 'upstream response',
    }))
  })

  return {
    server,
    start: () => new Promise<string>((resolve) => {
      server.listen(0, '127.0.0.1', () => {
        const addr = server.address() as { port: number }
        resolve(`http://127.0.0.1:${addr.port}`)
      })
    }),
  }
}
