import Fastify from 'fastify';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';


const app = Fastify();

await app.register(swagger, {
  openapi: { info: { title: 'CEP API', version: '0.1.0' } }
});

await app.register(swaggerUi, {
  routePrefix: '/docs',
  theme: {
    title: 'CEP API Docs'
  }
});

// register handlers
await import('./handlers/cep.js').then(m => m.default(app));

// One place to shape ALL errors (400/500/etc.)
app.setErrorHandler((err, req, reply) => {
  const status = err.statusCode && err.statusCode >= 400 ? err.statusCode : 500;
  if (status === 400) {
    const message = (err as any)?.message ?? 'Bad Request';
    reply.raw.removeHeader('content-type');
    reply.raw.removeHeader('connection');
    reply.raw.removeHeader('transfer-encoding');
    return reply.code(400).type('application/json; charset=utf-8').send(JSON.stringify({ error: message }));
  }
  if (status === 500) reply.raw.statusMessage = 'response status is 500'; // optional (HTTP/1.1)
  reply.raw.removeHeader('content-type');
  reply.raw.removeHeader('connection');
  reply.raw.removeHeader('transfer-encoding');
  reply.code(status).send();
});

// 404s in one place
app.setNotFoundHandler((req, reply) => {
  reply.raw.removeHeader('content-type');
  reply.raw.removeHeader('connection');
  reply.raw.removeHeader('transfer-encoding');
  reply.code(404).send();
});

export default {
  async fetch(request: any, env: unknown, ctx: any): Promise<any> {
    await app.ready();
    const url = new URL(request.url);
    const payload = request.method === 'GET' || request.method === 'HEAD' ? undefined : await request.text();
    const res = await app.inject({
      method: request.method,
      url: url.pathname + url.search,
      headers: Object.fromEntries(request.headers),
      payload
    });
    return new Response(res.body, {
      status: res.statusCode,
      headers: res.headers as any
    });
  }
};
