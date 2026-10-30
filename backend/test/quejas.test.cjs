require('reflect-metadata');
const assert = require('node:assert/strict');
const { test, before, beforeEach, after } = require('node:test');
const { Module, ValidationPipe, BadRequestException, ServiceUnavailableException } = require('@nestjs/common');
const { NestFactory } = require('@nestjs/core');
const { SwaggerModule, DocumentBuilder } = require('@nestjs/swagger');
const { QuejasController } = require('../dist/quejas/quejas.controller');
const { QuejasService } = require('../dist/quejas/quejas.service');
const { QuejasRepository } = require('../dist/quejas/quejas.repository');

const body = {
  nombre: 'Nombre sintético', apellidos: 'Apellidos de prueba', correo: 'prueba@example.invalid',
  direccion: 'Calle de prueba, 12', codigoPostal: '01234', telefono: '000000000', dni: 'PRUEBA123',
  fecha: '30-10-2026', hora: '14:30', linea: 7, numeroVehiculo: '0012',
  lugar: 'Lugar que no debe persistirse', parada: 'Parada sintética', sentido: 'Dirección de prueba', motivo: 'Motivo sintético\nSegunda línea.',
};
const attempts = [];
let unavailable = false;
let invalidLine = false;
const repository = {
  /** Captura los datos ya preparados sin insertar registros, o simula un fallo público del repositorio. */
  async crear(data, momento) {
    attempts.push({ data, momento });
    if (unavailable) throw new ServiceUnavailableException('No se ha podido registrar la queja. Inténtalo de nuevo.');
    if (invalidLine) throw new BadRequestException('Selecciona una línea disponible en el catálogo.');
    return 417;
  },
};
class TestModule {}
Module({ controllers: [QuejasController], providers: [QuejasService, { provide: QuejasRepository, useValue: repository }] })(TestModule);
let app;
let origin;

/** Inicia la API aislada con la misma validación global que el servidor real. */
before(async () => {
  app = await NestFactory.create(TestModule, { logger: false });
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
  await app.listen(0, '127.0.0.1');
  origin = await app.getUrl();
});

/** Aísla el registro de llamadas y los fallos simulados de cada caso. */
beforeEach(() => { attempts.length = 0; unavailable = false; invalidLine = false; });

/** Cierra el servidor HTTP de pruebas al terminar. */
after(async () => { if (app) await app.close(); });

/**
 * Envía una queja sintética a la API aislada, sin conectarse a MySQL.
 * @param payload Cuerpo JSON del caso de prueba.
 * @returns Respuesta HTTP de la operación con tiempo de espera limitado.
 */
async function crear(payload) {
  return fetch(`${origin}/api/quejas`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload), signal: AbortSignal.timeout(5000),
  });
}

/** Los campos opcionales admiten texto o null; Swagger no debe describirlos como objetos. */
test('Swagger documenta los seis obligatorios y los opcionales como cadenas', () => {
  const document = SwaggerModule.createDocument(app, new DocumentBuilder().setTitle('Prueba').build());
  const schema = document.components.schemas.CrearQuejaDto;
  assert.deepEqual(new Set(schema.required), new Set(['nombre', 'apellidos', 'correo', 'fecha', 'hora', 'linea']));
  for (const key of ['direccion', 'codigoPostal', 'telefono', 'dni', 'numeroVehiculo', 'lugar', 'parada', 'sentido', 'motivo']) {
    assert.equal(schema.properties[key].type, 'string');
    assert.equal(schema.properties[key].nullable, true);
  }
});

/** El cliente recibe solo el código y el estado, y la dirección y motivo usan la regla confirmada. */
test('POST /api/quejas confirma 201 con código y prepara los campos autorizados', async () => {
  const response = await crear(body);
  assert.equal(response.status, 201);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.deepEqual(await response.json(), { codigoIncidencia: 417, estado: 'Pendiente' });
  assert.equal(attempts.length, 1);
  assert.equal(attempts[0].data.direccionPostal, 'Calle de prueba, 12 Cp: 01234');
  assert.equal(attempts[0].data.detalle, body.motivo);
  assert.equal('lugar' in attempts[0].data, false);
  assert.equal(attempts[0].data.linea, 7);
  assert.equal(attempts[0].data.numeroVehiculo, '0012');
  assert.match(attempts[0].momento, /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
});

/** La obligatoriedad sigue siendo exactamente la de los seis campos marcados en el formulario. */
for (const key of ['nombre', 'apellidos', 'correo', 'fecha', 'hora', 'linea']) {
  test(`Rechaza la ausencia de ${key} antes de escribir`, async () => {
    const payload = { ...body };
    delete payload[key];
    assert.equal((await crear(payload)).status, 400);
    assert.deepEqual(attempts, []);
  });
}

/** Impide datos de tipo o tamaño incompatible y valores de calendario/hora imposibles. */
for (const [key, value] of [
  ['nombre', '   '], ['nombre', {}], ['nombre', 'a'.repeat(46)], ['apellidos', 'a'.repeat(46)],
  ['correo', 'incorrecto'], ['correo', 'a'.repeat(46) + '@example.invalid'],
  ['dni', 'a'.repeat(11)], ['telefono', 'a'.repeat(46)], ['numeroVehiculo', 'a'.repeat(46)],
  ['parada', 'a'.repeat(81)], ['sentido', 'a'.repeat(81)], ['direccion', 'a'.repeat(1001)],
  ['codigoPostal', 'a'.repeat(21)], ['lugar', 'a'.repeat(1001)], ['motivo', 'a'.repeat(20001)],
  ['fecha', '31-04-2026'], ['fecha', '29-02-2025'], ['fecha', '2026-10-30'], ['fecha', 30102026],
  ['hora', '24:00'], ['hora', '12:60'], ['hora', '1:30'], ['hora', '12:30:00'],
  ['linea', '7'], ['linea', 1.5], ['linea', 2147483648], ['linea', null],
]) {
  test(`Rechaza el valor no válido de ${key}: ${typeof value === 'string' && value.length > 100 ? `longitud ${value.length}` : JSON.stringify(value)}`, async () => {
    assert.equal((await crear({ ...body, [key]: value })).status, 400);
    assert.deepEqual(attempts, []);
  });
}

/** No permite que el navegador fije ids, estados, canal o fechas del registro. */
for (const [key, value] of [['id', 123], ['estado', 'cerrada'], ['via_recepcion', 'otro canal'], ['fecha_recepcion', '2000-01-01'], ['dp_idioma', 'ca'], ['id_resolucion', 999]]) {
  test(`Rechaza el campo de servidor ${key} añadido al cuerpo`, async () => {
    assert.equal((await crear({ ...body, [key]: value })).status, 400);
    assert.deepEqual(attempts, []);
  });
}

/** Los opcionales pueden faltar o ser nulos; el motivo sigue sin ser obligatorio. */
test('Admite solo los seis obligatorios y conserva una dirección y motivo ausentes como null', async () => {
  const response = await crear({ nombre: body.nombre, apellidos: body.apellidos, correo: body.correo, fecha: body.fecha, hora: body.hora, linea: body.linea });
  assert.equal(response.status, 201);
  assert.equal(attempts[0].data.direccionPostal, null);
  assert.equal(attempts[0].data.detalle, null);
});

/** La dirección conserva el CP como texto y no introduce etiquetas vacías. */
for (const [direccion, codigoPostal, expected] of [[null, '01234', 'Cp: 01234'], ['Solo dirección', null, 'Solo dirección'], ['', '', null]]) {
  test(`Prepara dirección y CP opcionales: ${JSON.stringify(expected)}`, async () => {
    assert.equal((await crear({ ...body, direccion, codigoPostal, motivo: null, dni: null })).status, 201);
    assert.equal(attempts[0].data.direccionPostal, expected);
    assert.equal(attempts[0].data.detalle, null);
    assert.equal(attempts[0].data.dni, null);
  });
}

/** El recorte no elimina espacios interiores, saltos de línea ni ceros significativos. */
test('Recorta extremos sin convertir tipos ni perder el texto del formulario', async () => {
  const response = await crear({ ...body, nombre: '  Nombre  de prueba  ', codigoPostal: ' 01234 ', correo: ' prueba@example.invalid ', motivo: '  Primera línea\nSegunda línea.  ' });
  assert.equal(response.status, 201);
  assert.equal(attempts[0].data.nombre, 'Nombre  de prueba');
  assert.equal(attempts[0].data.correo, body.correo);
  assert.equal(attempts[0].data.direccionPostal, 'Calle de prueba, 12 Cp: 01234');
  assert.equal(attempts[0].data.detalle, 'Primera línea\nSegunda línea.');
});

/** No confunde una línea desaparecida con una confirmación ni con un fallo técnico. */
test('Una línea que deja de estar disponible responde 400 sin confirmar el alta', async () => {
  invalidLine = true;
  const response = await crear(body);
  assert.equal(response.status, 400);
  assert.equal((await response.json()).message, 'Selecciona una línea disponible en el catálogo.');
});

/** La confirmación no se muestra si el repositorio no puede completar la transacción. */
test('Un fallo del alta responde 503 sin devolver ids ni datos personales', async () => {
  unavailable = true;
  const response = await crear(body);
  assert.equal(response.status, 503);
  const payload = await response.json();
  assert.equal(payload.message, 'No se ha podido registrar la queja. Inténtalo de nuevo.');
  assert.equal('codigoIncidencia' in payload, false);
  assert.equal(JSON.stringify(payload).includes(body.correo), false);
});
