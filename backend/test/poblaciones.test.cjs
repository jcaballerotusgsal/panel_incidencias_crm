require('reflect-metadata');
const assert = require('node:assert/strict');
const { test, before, beforeEach, after } = require('node:test');
const { Module } = require('@nestjs/common');
const { NestFactory } = require('@nestjs/core');
const { PoblacionesController } = require('../dist/poblaciones/poblaciones.controller');
const { PoblacionesService } = require('../dist/poblaciones/poblaciones.service');
const { PoblacionesRepository } = require('../dist/poblaciones/poblaciones.repository');

const fixture = [{ id_m_zona: 7, poblacion: 'Población de prueba A' }, { id_m_zona: 9, poblacion: 'Población de prueba B' }];
let poblaciones;
let fail;
const repository = {
  /** Simula el catálogo sin acceder ni modificar MySQL. */
  async listar() { if (fail) throw new Error('SQL privado, password=secreto'); return poblaciones; },
};
class TestModule {}
Module({ controllers: [PoblacionesController], providers: [PoblacionesService, { provide: PoblacionesRepository, useValue: repository }] })(TestModule);
let app;
let origin;

/** Inicia una API aislada en un puerto local aleatorio. */
before(async () => {
  app = await NestFactory.create(TestModule, { logger: false });
  app.setGlobalPrefix('api');
  await app.listen(0, '127.0.0.1');
  origin = await app.getUrl();
});

/** Restaura los datos de prueba para cada petición. */
beforeEach(() => { poblaciones = fixture; fail = false; });

/** Cierra el servidor HTTP al terminar. */
after(async () => { if (app) await app.close(); });

/** El desplegable recibe nombres e ids originales y no cachea el catálogo. */
test('GET /api/poblaciones devuelve id_m_zona y poblacion con no-store', async () => {
  const response = await fetch(`${origin}/api/poblaciones`);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.deepEqual(await response.json(), { poblaciones: fixture });
});

/** La ausencia de poblaciones es un resultado válido que permite omitir la zona. */
test('El catálogo de poblaciones vacío responde 200', async () => {
  poblaciones = [];
  const response = await fetch(`${origin}/api/poblaciones`);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { poblaciones: [] });
});

/** Los nombres repetidos no eliminan sus ids distintos. */
test('Conserva poblaciones con el mismo nombre e ids diferentes', async () => {
  poblaciones = [{ id_m_zona: 0, poblacion: 'Población sintética' }, { id_m_zona: 9, poblacion: 'Población sintética' }];
  assert.deepEqual(await (await fetch(`${origin}/api/poblaciones`)).json(), { poblaciones });
});

/** El error público no contiene el fallo del driver ni credenciales. */
test('Un fallo al leer poblaciones devuelve 503 sin detalles privados', async () => {
  fail = true;
  const response = await fetch(`${origin}/api/poblaciones`);
  assert.equal(response.status, 503);
  const body = await response.json();
  assert.equal(body.message, 'No se han podido cargar las poblaciones. Inténtalo de nuevo.');
  assert.equal(JSON.stringify(body).includes('secreto'), false);
  assert.equal(JSON.stringify(body).includes('SQL privado'), false);
});

/** No se permite modificar este catálogo mediante la API. */
test('POST /api/poblaciones no expone escritura', async () => {
  assert.equal((await fetch(`${origin}/api/poblaciones`, { method: 'POST' })).status, 404);
});
