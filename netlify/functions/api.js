// Netlify Functions (v2) entry.
// The same Express app used in local dev runs inside the function instance;
// each incoming Web Request is bridged to it over an ephemeral local port,
// so streamed text responses (SSE-style deltas) keep working end to end.
import http from 'node:http'
import app from '../../server/app.js'

let serverPromise

function getServer() {
  if (!serverPromise) {
    serverPromise = new Promise((resolve, reject) => {
      const s = http.createServer(app)
      s.listen(0, '127.0.0.1', () => resolve(s))
      s.on('error', reject)
    })
  }
  return serverPromise
}

const PASS_HEADERS = new Set(['content-type', 'cache-control', 'x-accel-buffering'])

export default async (request) => {
  const server = await getServer()
  const { port } = server.address()
  const u = new URL(request.url)

  const init = { method: request.method, headers: request.headers }
  if (!['GET', 'HEAD'].includes(request.method) && request.body) {
    init.body = Buffer.from(await request.arrayBuffer())
  }

  const upstream = await fetch(`http://127.0.0.1:${port}${u.pathname}${u.search}`, init)

  const headers = new Headers()
  for (const [k, v] of upstream.headers) {
    if (PASS_HEADERS.has(k)) headers.set(k, v)
  }
  return new Response(upstream.body, { status: upstream.status, headers })
}

export const config = {
  path: '/api/*',
}
