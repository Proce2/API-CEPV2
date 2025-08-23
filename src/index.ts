
import Fastify from 'fastify'
import swagger from '@fastify/swagger'
const app = Fastify({ logger: false })


await app.register(swagger, {
  openapi: { info: { title: 'CEP API', version: '0.1.0' } }
});

app.get('/openapi.json', async (_req, rep) => {
  return rep.type('application/json').send(app.swagger())
})

app.get('/docs', async (_req, rep) => {
  const html = `<!doctype html><html><head>
<meta charset="utf-8"/><title>CEP API Docs</title>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist/swagger-ui.css">
</head><body><div id="swagger-ui"></div>
<script src="https://unpkg.com/swagger-ui-dist/swagger-ui-bundle.js"></script>
<script>SwaggerUIBundle({ url: 'openapi.json', dom_id: '#swagger-ui' });</script>
</body></html>`
  return rep.type('text/html; charset=utf-8').send(html)
})

// register handlers (no extension so bundler resolves TS)
await import('./handlers/cep').then(m => m.default(app))

// One place to shape ALL errors (400/500/etc.)
app.setErrorHandler((err, _req, rep) => {
  const s = (err as any).statusCode && (err as any).statusCode >= 400 ? (err as any).statusCode : 500
  if (s === 400) return rep.code(400).type('application/json; charset=utf-8').send({ error: (err as any)?.message ?? 'Bad Request' })
  return rep.code(s).send()
})

// 404s in one place
app.setNotFoundHandler((_req, rep) => rep.code(404).send())
const ready = app.ready()

export default {
  async fetch(request: Request): Promise<Response> {
    await ready
    const url = new URL(request.url)
    const BASE = '/api'
    const pathname = url.pathname.startsWith(BASE) ? (url.pathname.slice(BASE.length) || '/') : url.pathname
    const payload = (request.method === 'GET' || request.method === 'HEAD') ? undefined : await request.text()
    const res: any = await app.inject({ method: request.method as any, url: pathname + url.search, headers: Object.fromEntries(request.headers), payload })
    return new Response(res.body as any, { status: res.statusCode, headers: res.headers as any })
  }
}
