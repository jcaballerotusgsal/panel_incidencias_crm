require('reflect-metadata');
const assert = require('node:assert/strict');
const { test, before, beforeEach, after } = require('node:test');
const { Module } = require('@nestjs/common');
const { NestFactory } = require('@nestjs/core');
const { LineasController } = require('../dist/lineas/lineas.controller');
const { LineasService } = require('../dist/lineas/lineas.service');
const { LineasRepository } = require('../dist/lineas/lineas.repository');

const fixture = [
  { id_linea_amb: 7, nom_linea_tusgsal: 'B1' },
  { id_linea_amb: 42, nom_linea_tusgsal: 'N2' },
];
let lineas;
let unavailable;
const repository = {
  /** Simula solo la lectura del catálogo, sin conectar ni modificar MySQL. */
  async listar() {
    if (unavailable) throw new Error('password=secreto SQL privado');
    return lineas;
  },
};
class TestModule {}
Module({
  controllers: [LineasController],
  providers: [LineasService, { provide: LineasRepository, useValue: repository }],
})(TestModule);
let app;
let origin;

/** Inicia una API aislada del catálogo en un puerto local aleatorio. */
before(async () => {
  app = await NestFactory.create(TestModule, { logger: false });
  app.setGlobalPrefix('api');
  await app.listen(0, '127.0.0.1');
  origin = await app.getUrl();
});

/** Restaura los datos y la disponibilidad del catálogo para cada caso. */
beforeEach(() => { lineas = fixture; unavailable = false; });

/** Libera el servidor HTTP al terminar las comprobaciones. */
after(async () => { if (app) await app.close(); });

/** Comprueba el contrato de id real/nombre y que el catálogo no se cachea. */
test('GET /api/lineas devuelve los identificadores del catálogo y sus nombres', async () => {
  const response = await fetch(`${origin}/api/lineas`);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.deepEqual(await response.json(), { lineas: fixture });
});

/** La ausencia de opciones es un resultado válido, independiente de los fallos de servicio. */
test('Un catálogo vacío responde 200 con una lista vacía', async () => {
  lineas = [];
  const response = await fetch(`${origin}/api/lineas`);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { lineas: [] });
});

/** Mantiene opciones con nombres iguales pero identificadores diferentes. */
test('Dos líneas con igual nombre conservan sus respectivos identificadores', async () => {
  lineas = [{ id_linea_amb: 7, nom_linea_tusgsal: 'N2' }, { id_linea_amb: 42, nom_linea_tusgsal: 'N2' }];
  const response = await fetch(`${origin}/api/lineas`);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { lineas });
});

/** Oculta los mensajes del driver y diferencia indisponibilidad de un catálogo vacío. */
test('Un fallo del catálogo devuelve 503 sin SQL ni credenciales', async () => {
  unavailable = true;
  const response = await fetch(`${origin}/api/lineas`);
  assert.equal(response.status, 503);
  const body = await response.json();
  assert.equal(body.message, 'No se han podido cargar las líneas. Inténtalo de nuevo.');
  assert.ok(!JSON.stringify(body).includes('secreto'));
  assert.ok(!JSON.stringify(body).includes('SQL'));
});

/** El catálogo no expone una operación de escritura. */
test('POST /api/lineas no permite guardar datos', async () => {
  const response = await fetch(`${origin}/api/lineas`, { method: 'POST' });
  assert.equal(response.status, 404);
});
