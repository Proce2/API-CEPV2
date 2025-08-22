import Fastify from 'fastify';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';

import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const fav16 = readFileSync(require.resolve('swagger-ui-dist/favicon-16x16.png'));
const fav32 = readFileSync(require.resolve('swagger-ui-dist/favicon-32x32.png'));

const app = Fastify();

await app.register(swagger, {
  openapi: { info: { title: 'CEP API', version: '0.1.0' } }
});

await app.register(swaggerUi, {
  routePrefix: '/docs',
  theme: {
    favicon: [
      { filename: 'swagger-16.png', rel: 'icon', sizes: '16x16', type: 'image/png', content: fav16 },
      { filename: 'swagger-32.png', rel: 'icon', sizes: '32x32', type: 'image/png', content: fav32 }
    ],
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

// bind to the container port Northflank expects
const port = Number(process.env.PORT) || 8080;
await app.listen({ port, host: '0.0.0.0' });
console.log(`listening on http://0.0.0.0:${port}`);
