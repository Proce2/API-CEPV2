import Fastify from 'fastify';
import swagger from '@fastify/swagger';
const app = Fastify();

await app.register(swagger, {
  openapi: { info: { title: 'CEP API', version: '0.1.0' } }
});

const html = `<!DOCTYPE html><html><head><title>CEP API Docs</title><link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist/swagger-ui.css"></head><body><div id="swagger-ui"></div><script src="https://unpkg.com/swagger-ui-dist/swagger-ui-bundle.js"></script><script>SwaggerUIBundle({url:'/openapi.json',dom_id:'#swagger-ui'})</script></body></html>`;

app.get('/openapi.json', (_r, rep) => rep.type('application/json').send(app.swagger()));
app.get('/docs', (_r, rep) => rep.type('text/html; charset=utf-8').send(html));

// register handlers
await import('./handlers/cep.js').then(m => m.default(app));

// One place to shape ALL errors (400/500/etc.)
app.setErrorHandler((e, _r, rep) => {
  const s = e.statusCode && e.statusCode >= 400 ? e.statusCode : 500;
  if (s === 400) return rep.code(400).type('application/json').send({ error: (e as any)?.message || 'Bad Request' });
  return rep.code(s).send();
});

// 404s in one place
app.setNotFoundHandler((_r, rep) => rep.code(404).send());
const ready = app.ready();

export default {
  async fetch(request: any): Promise<any> {
    await ready;
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
