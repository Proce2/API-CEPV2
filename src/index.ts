
import { Hono } from 'hono'
import { swaggerUI } from '@hono/swagger-ui'
import { lookupCep } from './services/viacep'

function validateCep(raw: string | null): string | null {
  const n = (raw ?? '').replace(/-/g, '')
  if (!n) return 'CEP is required.'
  if (n.length !== 8 || !/^[0-9]+$/.test(n)) return 'CEP must be 8 digits.'
  return null
}

// Minimal OpenAPI spec (served at /openapi.json)
const openapi = {
  openapi: '3.0.3',
  info: {
    title: 'CEP API',
    version: 'v2',
    description: 'Api Busca'
  },
  servers: [
    { url: 'https://cep.apidocs.workers.dev/', description: 'Production' }
  ],
  tags: [
    { name: 'CEP', description: 'Brazilian postal code lookup' }
  ],
  paths: {
    '/CEP/BuscaCEP': {
      get: {
        tags: ['CEP'],
        parameters: [
          { name: 'cep', in: 'query', required: true, schema: { type: 'string' }, description: '8 digits' }
        ],
        responses: {
          '200': {
            description: 'Success',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    cep: { type: 'string' },
                    street: { type: 'string' },
                    neighborhood: { type: 'string' },
                    city: { type: 'string' },
                    state: { type: 'string' }
                  }
                }
              }
            }
          },
          '400': { description: 'Bad Request' },
          '404': { description: 'Not Found' }
        }
      }
    }
  }
} as const

const app = new Hono()

// 1) Serve a favicon at the standard path browsers auto-request
const SWAGGER_FAV16 = 'https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/favicon-16x16.png'
const SWAGGER_FAV32 = 'https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/favicon-32x32.png'

app.get('/favicon.ico', async (c) => {
  const r = await fetch(SWAGGER_FAV32)
  return new Response(r.body, {
    headers: {
      'content-type': 'image/png',
      'cache-control': 'public, max-age=31536000, immutable'
    }
  })
})

// 2) (Optional) also expose the PNG paths some browsers/tools might request
app.get('/favicon-16x16.png', async (c) => {
  const r = await fetch(SWAGGER_FAV16)
  return new Response(r.body, {
    headers: {
      'content-type': 'image/png',
      'cache-control': 'public, max-age=31536000, immutable'
    }
  })
})

app.get('/favicon-32x32.png', async (c) => {
  const r = await fetch(SWAGGER_FAV32)
  return new Response(r.body, {
    headers: {
      'content-type': 'image/png',
      'cache-control': 'public, max-age=31536000, immutable'
    }
  })
})



// Spec + full Swagger UI (blue GET, Try it out)
// OpenAPI spec
app.get('/openapi.json', (c) => c.json(openapi))

// Swagger UI — mount directly
app.get('/docs', swaggerUI({ url: '/openapi.json' }))

// Make root open the docs (optional but handy)
app.get('/', (c) => c.redirect('/docs', 308))

// API
app.get('/CEP/BuscaCEP', async (c) => {
  const cep = c.req.query('cep') ?? null
  const err = validateCep(cep)
  if (err) return c.json({ error: err }, 400)

  const data = await lookupCep(cep!)
  if ((data as any)?.erro) return c.body(null, 404)

  return c.json({
    cep: data.cep,
    street: data.logradouro,
    neighborhood: data.bairro,
    city: data.localidade,
    state: data.uf
  })
})

export default app
