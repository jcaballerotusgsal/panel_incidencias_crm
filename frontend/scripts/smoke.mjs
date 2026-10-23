import assert from 'node:assert/strict';

const origin = process.env.SMOKE_ORIGIN ?? 'http://127.0.0.1:3000';

/** Descarga un recurso y falla ante HTTP no exitoso o un timeout. */
async function get(path) {
  const response = await fetch(new URL(path, origin), {
    signal: AbortSignal.timeout(30000),
  });
  assert.equal(response.status, 200, `Error en ${path}: HTTP ${response.status}`);
  return response;
}

/** Valida Next.js, la comunicación interna con NestJS y la página inicial. */
async function run() {
  const web = await (await get('/health')).json();
  assert.equal(web.service, 'backoffice-web');
  const api = await (await get('/api/health')).json();
  assert.equal(api.status, 'ok');
  assert.equal(api.service, 'backoffice-api');
  const info = await (await get('/api')).json();
  assert.equal(info.name, 'Backoffice API');
  const html = await (await get('/')).text();
  assert.ok(html.includes('Tu backoffice empieza aquí.'));
  console.log('OK: Next.js, API interna y página inicial responden correctamente.');
}

run().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
