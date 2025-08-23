# GitHub Copilot — Workspace Instructions (VS Code)

> Place this file at **`.github/copilot-instructions.md`** in your repo. These instructions apply to Copilot Chat and code suggestions in this workspace. **Follow this plan strictly.**

---

## Global Behavior

* Use **simple English**. Be direct, concise, and practical.
* **Do not ask clarification questions** unless absolutely required to avoid a bug.
* Prefer **copy‑pasteable** answers over theory. No fluff.
* Respect **project context** (Fastify on Cloudflare Workers).

## Response Format

* When showing code, **limit each code block to ≤ 3 lines**.
* If more lines are required, **stream in numbered chunks**: `Part 1/…`, `Part 2/…`, etc., each with ≤ 3 lines.
* Show commands in separate blocks (also ≤ 3 lines).

**Example (chunking):**

```ts
// Part 1/3
await app.register(swagger,{openapi:{info:{title:'CEP API',version:'0.1.0'}}})
```

```ts
// Part 2/3
app.get('/openapi.json',(_r,rep)=>rep.type('application/json').send(app.swagger()))
```

```ts
// Part 3/3
app.get('/docs',(_r,rep)=>rep.type('text/html').send(html))
```

---

## Project Plan — CEP API on Cloudflare Workers

**Goal:** Worker‑safe Fastify server with Swagger JSON and a CDN‑hosted UI.

1. **Dependencies**

* Remove UI packages that rely on filesystem.
* Keep `@fastify/swagger` and `fastify`.
* Optional: remove `undici` (Workers have global `fetch`).

**Commands:**

```bash
npm remove @fastify/swagger-ui swagger-ui-dist
npm i -D wrangler
```

```bash
# optional
npm remove undici
```

2. **Swagger (memory JSON + CDN UI)**

* Register only `@fastify/swagger`.
* Expose schema at **`/openapi.json`** using `app.swagger()`.
* Serve docs at **`/docs`** via **CDN `swagger-ui-dist`**.

**Routes (sketch):**

```ts
app.get('/openapi.json',(_r,rep)=>rep.type('application/json').send(app.swagger()))
```

```ts
app.get('/docs',(_r,rep)=>rep.type('text/html; charset=utf-8').send(html))
```

```ts
// html contains CDN links to swagger-ui-dist css/js
```

3. **Worker Bridge**

* Use `export default { fetch() }`.
* Use `app.inject()` for request handling.
* `await app.ready()` once per isolate.

**Bridge (sketch):**

```ts
const ready=app.ready()
export default{fetch:async(req)=>{await ready;/* inject */}}
```

```ts
// payload=GET/HEAD? undefined: await request.text()
```

4. **Error Handling**

* No `reply.raw.*` mutations.
* 400 → JSON `{ error }`; others → empty body with status.

**Handler (sketch):**

```ts
app.setErrorHandler((e,_r,rep)=>{const s=e.statusCode>=400?e.statusCode:500
```

```ts
if(s===400)return rep.code(400).type('application/json').send({error:e.message||'Bad Request'})
```

```ts
return rep.code(s).send()})
```

5. **Routing**

* Keep `/CEP/BuscaCEP?cep=`.
* Validate CEP (8 digits). Throw 400 on invalid.
* Map ViaCEP → `{ cep, street, neighborhood, city, state }`.

**Validation (sketch):**

```ts
const n=(cep||'').replace(/-/g,''); if(!n) throw400('CEP is required.')
```

```ts
if(n.length!==8||!/^[0-9]+$/.test(n)) throw400('CEP must be 8 digits.')
```

```ts
function throw400(msg){const e=new Error(msg); e.statusCode=400; throw e}
```

6. **Deploy**

* `wrangler.json` → `main: dist/index.js`, `nodejs_compat` flag.
* In CI/Pages: set `CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ACCOUNT_ID`.

**Commands:**

```bash
npm ci && npm run build
npx wrangler dev
```

```bash
npx wrangler deploy
```

---

## Coding Patterns — Allowed / Avoided

**Allowed**

* `app.inject()` with `fetch()` bridge.
* Global `fetch` for external HTTP.
* CDN for Swagger UI assets.

**Avoid**

* `@fastify/swagger-ui`, `@fastify/static`, or any filesystem usage.
* `reply.raw.removeHeader`, direct Node HTTP mutations.
* Long code blocks; never exceed 3 lines per block.

---

## Answer Templates

**Bug fix request**

```text
Summary: 1 sentence.
Steps: 1‑3 bullets.
Code: ≤3 lines per block, chunked if needed.
```

**Feature request**

```text
Plan: numbered list (max 5).
Files: list touched.
Code: ≤3 lines per block.
```

**Command output**

```text
Show only commands + key result lines.
No screenshots. ≤3 lines per block.
```

---

## Safeguards

* Never print secrets or env values.
* If a step would break Workers runtime, **stop** and propose a Worker‑safe alternative (≤ 3 lines).
* Prefer **minimal diffs** and **atomic commits**.

---

## Quick Prompts (for me to reuse)

```text
"Refactor error handler to be Worker‑safe; keep same behavior."
"Add /openapi.json route and CDN‑backed /docs; no filesystem."
"Split patch into 3‑line chunks; label Part 1/…"
```
