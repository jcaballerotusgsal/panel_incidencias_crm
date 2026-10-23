// Pruebas contra el código compilado y un servidor real en un puerto aleatorio.
require('reflect-metadata');
const assert = require('node:assert/strict');
const { test, before, after } = require('node:test');
const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('../dist/app.module');
const { HealthService } = require('../dist/health/health.service');
let app;
let origin;

before(async () => {
  app = await NestFactory.create(AppModule, { logger: false });
  app.setGlobalPrefix('api');
  await app.listen(0, '127.0.0.1');
  origin = await app.getUrl();
});

after(async () => { if (app) await app.close(); });

test('HealthService devuelve un contrato de salud válido', () => {
  const health = new HealthService().getStatus();
  assert.equal(health.status, 'ok');
  assert.equal(health.database, 'not-configured');
  assert.ok(Number.isFinite(Date.parse(health.timestamp)));
  assert.ok(health.uptimeSeconds >= 0);
});

test('GET /api/health responde 200 y no permite cachear el estado', async () => {
  const response = await fetch(`${origin}/api/health`);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  const body = await response.json();
  assert.equal(body.status, 'ok');
  assert.equal(body.service, 'backoffice-api');
});

test('GET /api devuelve la identificación del servicio', async () => {
  const response = await fetch(`${origin}/api`);
  assert.equal(response.status, 200);
  assert.equal((await response.json()).name, 'Backoffice API');
});

test('Una ruta inexistente responde 404', async () => {
  const response = await fetch(`${origin}/api/no-existe`);
  assert.equal(response.status, 404);
});
