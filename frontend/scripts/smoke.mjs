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

/**
 * Valida Next.js, el proxy, formularios, catálogos y los casos de consulta inválida o sin coincidencia.
 * La consulta sintética 404 genera un log; las entradas 400 no ejecutan SQL ni crean quejas.
 * @returns Promesa que termina cuando las respuestas cumplen sus contratos.
 * @throws AssertionError ante estados o contenidos inesperados; Error ante fallos de red.
 */
async function run() {
  const web = await (await get('/health')).json();
  assert.equal(web.service, 'backoffice-web');
  const api = await (await get('/api/health')).json();
  assert.equal(api.status, 'ok');
  assert.equal(api.service, 'backoffice-api');
  const info = await (await get('/api')).json();
  assert.equal(info.name, 'Backoffice API');
  const html = await (await get('/')).text();
  assert.ok(html.includes('Consulta de incidencias'));
  assert.ok(html.includes('name="codigoIncidencia"'));
  assert.ok(html.includes('name="identificador"'));
  const queja = await (await get('/quejas/nueva')).text();
  assert.ok(queja.includes('Crear una queja'));
  for (const campo of ['nombre', 'apellidos', 'direccion', 'codigoPostal', 'telefono', 'correo', 'dni', 'fecha', 'hora', 'linea', 'zona', 'numeroVehiculo', 'lugar', 'parada', 'sentido', 'motivo']) {
    assert.ok(queja.includes(`name="${campo}"`), `Falta el campo ${campo} de la queja`);
  }
  assert.ok(queja.includes('type="date"'), 'Falta el selector de fecha');
  const catalogo = await (await get('/api/lineas')).json();
  assert.ok(Array.isArray(catalogo.lineas));
  assert.ok(catalogo.lineas.every((linea) => Number.isSafeInteger(linea.id_linea_amb)
    && typeof linea.nom_linea_tusgsal === 'string' && linea.nom_linea_tusgsal.trim()));
  const poblaciones = await (await get('/api/poblaciones')).json();
  assert.ok(Array.isArray(poblaciones.poblaciones));
  assert.ok(poblaciones.poblaciones.every((poblacion) => Number.isSafeInteger(poblacion.id_m_zona)
    && typeof poblacion.poblacion === 'string' && poblacion.poblacion.trim()));
  const resultado = await (await get('/incidencias/resultado')).text();
  assert.ok(resultado.includes('Resultado de la consulta'));
  const invalid = await fetch(new URL('/api/incidencias/consulta', origin), {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: '{}', signal: AbortSignal.timeout(10000),
  });
  assert.equal(invalid.status, 400);
  const invalidQueja = await fetch(new URL('/api/quejas', origin), {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: '{}', signal: AbortSignal.timeout(10000),
  });
  assert.equal(invalidQueja.status, 400);
  const missing = await fetch(new URL('/api/incidencias/consulta', origin), {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ codigoIncidencia: 2147483647, identificador: 'SMOKE-SIN-COINCIDENCIA' }),
    signal: AbortSignal.timeout(10000),
  });
  assert.equal(missing.status, 404);
  assert.equal((await missing.json()).message, 'No se han encontrado los datos.');
  console.log('OK: Next.js, API, consulta, resultado, formulario v2 con calendario y catalogos de lineas/poblaciones.');
}

run().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
