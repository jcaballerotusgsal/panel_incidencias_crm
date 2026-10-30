require('reflect-metadata');
const assert = require('node:assert/strict');
const { test } = require('node:test');
const { DatabaseService } = require('../dist/database/database.service');
const { QuejasRepository } = require('../dist/quejas/quejas.repository');
const { isFechaSuceso, fechaHoraRecepcion } = require('../dist/quejas/validaciones');

const data = {
  nombre: 'Nombre sintético', apellidos: 'Apellidos de prueba', correo: 'prueba@example.invalid',
  dni: 'PRUEBA123', telefono: '000000000', direccionPostal: 'Calle de prueba\nCP: 01234',
  fecha: '30-10-2026', hora: '14:30', linea: 7, numeroVehiculo: '0012',
  parada: 'Parada de prueba', sentido: 'Dirección de prueba', detalle: 'Detalle sintético',
};

/**
 * Sustituye solo la conexión; ejecuta la transacción y el repositorio reales sobre respuestas sintéticas.
 * @param options Línea/población ausentes o paso SQL que debe fallar.
 * @returns Repositorio y llamadas observadas, sin acceso a registros del CRM.
 */
function fixture(options = {}) {
  const calls = [];
  let step = 0;
  const session = {
    /** Inicia la operación para comprobar el orden transaccional. */
    async beginTransaction() { calls.push('begin'); },
    /** Captura SQL y parámetros y simula ids distintos para cada tabla. */
    async execute(query, values) {
      step++;
      calls.push({ sql: query.sql, values });
      if (options.failAt === step) throw new Error('SQL privado con datos personales');
      if (step === 1) return [options.noLine ? [] : [{ id_linea_amb: data.linea }]];
      if (query.sql.includes('FROM crm_m_zona_poblaciones')) return [options.noZone ? [] : [{ id_m_zona: values[0] }]];
      const table = /INSERT INTO (crm_incidencia|crm_respuesta|crm_expediente)/.exec(query.sql)?.[1];
      return [{ affectedRows: 1, insertId: { crm_incidencia: 417, crm_respuesta: 829, crm_expediente: 931 }[table] }];
    },
    /** Registra el único COMMIT esperado al final. */
    async commit() { calls.push('commit'); },
    /** Registra la reversión ante cualquier paso fallido. */
    async rollback() { calls.push('rollback'); },
    /** Registra la devolución de la conexión. */
    release() { calls.push('release'); },
  };
  const database = new DatabaseService();
  database.pool = { getConnection: async () => session };
  return { repository: new QuejasRepository(database), calls };
}

/** Verifica las claves generadas, las fechas coherentes y el orden real de las tres tablas. */
test('Crea incidencia, respuesta y expediente con sus ids vinculados en una transacción', async () => {
  const { repository, calls } = fixture();
  const momento = '2026-10-30 15:04:05';
  assert.equal(await repository.crear(data, momento), 417);
  assert.equal(calls[0], 'begin');
  assert.match(calls[1].sql, /SELECT id_linea_amb[\s\S]*LOCK IN SHARE MODE/);
  assert.deepEqual(calls[1].values, [7]);
  assert.match(calls[2].sql, /INSERT INTO crm_incidencia/);
  assert.match(calls[2].sql, /'formulario web'/);
  assert.match(calls[2].sql, /'Queja'/);
  assert.deepEqual(calls[2].values, [momento, data.nombre, data.apellidos, data.dni, data.telefono, data.correo, data.direccionPostal, '2026-10-30', '14:30', 7, '0012', null, data.parada, data.sentido, data.detalle, momento, momento]);
  assert.match(calls[3].sql, /INSERT INTO crm_respuesta/);
  assert.match(calls[3].sql, /'pendiente'[\s\S]*'correo electronico'[\s\S]*'abierta'/);
  assert.deepEqual(calls[3].values, [417, '2026-10-30', momento, momento]);
  assert.match(calls[4].sql, /INSERT INTO crm_expediente[\s\S]*'Pendiente'/);
  assert.deepEqual(calls[4].values, [417, 829]);
  assert.deepEqual(calls.slice(-2), ['commit', 'release']);
  for (const call of calls.filter((item) => typeof item === 'object')) {
    assert.equal((call.sql.match(/\?/g) ?? []).length, call.values.length);
  }
});

/** Ninguna inserción debe empezar si la línea deja de estar disponible. */
test('Rechaza una línea inexistente sin insertar filas', async () => {
  const { repository, calls } = fixture({ noLine: true });
  await assert.rejects(repository.crear(data, '2026-10-30 15:04:05'), (error) => error.getStatus() === 400);
  assert.equal(calls.filter((item) => typeof item === 'object').length, 1);
  assert.deepEqual(calls.slice(-2), ['rollback', 'release']);
});

/** No se continúan los INSERT ni se confirma si falla la lectura o cualquiera de las tablas. */
for (const failAt of [1, 2, 3, 4]) {
  test(`Un fallo SQL en el paso ${failAt} revierte el alta completa`, async () => {
    const { repository, calls } = fixture({ failAt });
    await assert.rejects(repository.crear(data, '2026-10-30 15:04:05'), (error) => error.getStatus() === 503);
    assert.equal(calls.filter((item) => typeof item === 'object').length, failAt);
    assert.equal(calls.includes('commit'), false);
    assert.deepEqual(calls.slice(-2), ['rollback', 'release']);
  });
}

/** Texto que parece SQL se conserva como dato y no cambia la sentencia. */
test('Mantiene los datos personales separados del texto SQL', async () => {
  const { repository, calls } = fixture();
  const nombre = "Prueba ' OR 1=1 --";
  await repository.crear({ ...data, nombre, dni: '', telefono: null, numeroVehiculo: '', parada: null, sentido: undefined }, '2026-10-30 15:04:05');
  assert.equal(calls[2].sql.includes(nombre), false);
  assert.equal(calls[2].values[1], nombre);
  for (const index of [3, 4, 10, 11, 12, 13]) assert.equal(calls[2].values[index], null);
});

/** La zona seleccionada se valida y se enlaza sin alterar los ids de los tres INSERT. */
for (const zona of [9, 0]) {
  test(`Guarda id_m_zona ${zona} tras comprobarlo dentro de la transacción`, async () => {
    const { repository, calls } = fixture();
    assert.equal(await repository.crear({ ...data, zona }, '2026-10-30 15:04:05'), 417);
    assert.match(calls[2].sql, /SELECT id_m_zona[\s\S]*LOCK IN SHARE MODE/);
    assert.deepEqual(calls[2].values, [zona]);
    assert.equal(calls[3].values[11], zona);
    assert.deepEqual(calls[4].values, [417, '2026-10-30', '2026-10-30 15:04:05', '2026-10-30 15:04:05']);
    assert.deepEqual(calls[5].values, [417, 829]);
    assert.deepEqual(calls.slice(-2), ['commit', 'release']);
  });
}

/** La FK no se deja como único control: se rechaza la opción antes de insertar la incidencia. */
test('Una población inexistente responde 400 y no inserta filas', async () => {
  const { repository, calls } = fixture({ noZone: true });
  await assert.rejects(repository.crear({ ...data, zona: 9 }, '2026-10-30 15:04:05'), (error) => error.getStatus() === 400);
  assert.equal(calls.filter((call) => typeof call === 'object').length, 2);
  assert.deepEqual(calls.slice(-2), ['rollback', 'release']);
});

/** Los fallos después de añadir la lectura de zona tampoco permiten COMMIT ni altas parciales. */
for (const failAt of [2, 3, 4, 5]) {
  test(`Revierte un alta con zona al fallar su paso SQL ${failAt}`, async () => {
    const { repository, calls } = fixture({ failAt });
    await assert.rejects(repository.crear({ ...data, zona: 9 }, '2026-10-30 15:04:05'), (error) => error.getStatus() === 503);
    assert.equal(calls.includes('commit'), false);
    assert.deepEqual(calls.slice(-2), ['rollback', 'release']);
  });
}

/** Fechas reales y límites de calendario; no basta con cumplir una expresión regular. */
for (const [fecha, expected] of [['29-02-2024', true], ['29-02-2000', true], ['29-02-1900', false], ['29-02-2025', false], ['31-04-2026', false], ['30-10-2026', true], ['2026-10-30', false], ['01-01-0999', false], ['00-10-2026', false], ['01-13-2026', false], [null, false], [30102026, false]]) {
  test(`Valida la fecha de calendario ${JSON.stringify(fecha)}`, () => assert.equal(isFechaSuceso(fecha), expected));
}

/** La recepción usa el reloj del servidor y la zona de Madrid, incluido el cambio de día y horario. */
for (const [utc, expected] of [['2026-10-30T12:34:56Z', '2026-10-30 13:34:56'], ['2026-07-01T22:30:00Z', '2026-07-02 00:30:00'], ['2026-10-25T00:30:00Z', '2026-10-25 02:30:00'], ['2026-10-25T01:30:00Z', '2026-10-25 02:30:00']]) {
  test(`Fecha de recepción en Madrid para ${utc}`, () => assert.equal(fechaHoraRecepcion(new Date(utc)), expected));
}
