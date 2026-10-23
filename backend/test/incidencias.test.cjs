require('reflect-metadata');
const assert = require('node:assert/strict');
const { test, before, after } = require('node:test');
const { Module, ValidationPipe, ServiceUnavailableException } = require('@nestjs/common');
const { NestFactory } = require('@nestjs/core');
const { IncidenciasController } = require('../dist/incidencias/incidencias.controller');
const { IncidenciasService } = require('../dist/incidencias/incidencias.service');
const { IncidenciasRepository } = require('../dist/incidencias/incidencias.repository');
const { DatabaseService } = require('../dist/database/database.service');

// Datos enteramente sintéticos: no se insertan ni modifican registros del CRM.
const fixture = {
  id: 417, fecha_recepcion: '2026-10-23 10:00:00', via_recepcion: 'Prueba',
  atendido_por: null, dp_nombre: 'Nombre de prueba', dp_apellidos: 'AMB-PRUEBA',
  dp_dni: 'PRUEBA123', dp_sexo: null, dp_idioma: null, dp_telefono: null,
  dp_email: 'prueba@example.invalid', dp_correoPostal: null, m_tipo: null,
  m_fechaAcontecimiento_date: null, m_hora: null, m_linea: 777, nom_linea_tusgsal: 'N99', m_vehiculo: null,
  m_zona: null, m_parada: null, m_sentido: null, m_detalle: '<script>prueba</script>',
  nombre_corto: null, incidencia_created_date: null, incidencia_date_updated: null,
  e_matricula: null, e_conductor: null, e_fecha: null, e_tempo: null,
};

const repository = {
  /** Simula únicamente la coincidencia de id e identificador, incluidos fallos del servicio. */
  async findByCredentials(id, identificador) {
    if (identificador === 'SERVICIO-NO-DISPONIBLE') {
      throw new ServiceUnavailableException('No se ha podido consultar la incidencia. Inténtalo de nuevo.');
    }
    return id === fixture.id && [fixture.dp_dni, fixture.dp_email, fixture.dp_apellidos].includes(identificador)
      ? fixture : null;
  },
};
class TestModule {}
Module({
  controllers: [IncidenciasController],
  providers: [IncidenciasService, { provide: IncidenciasRepository, useValue: repository }],
})(TestModule);

let app;
let origin;

/** Inicia un servidor HTTP aislado con la misma validación que la API real. */
before(async () => {
  app = await NestFactory.create(TestModule, { logger: false });
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
  await app.listen(0, '127.0.0.1');
  origin = await app.getUrl();
});

/** Libera el puerto del servidor de pruebas. */
after(async () => { if (app) await app.close(); });

/**
 * Envía cuerpos sintéticos al endpoint de pruebas sin acceder a MySQL.
 * @param body JSON de entrada del caso de prueba.
 * @returns Respuesta HTTP con un máximo de cinco segundos de espera.
 */
async function consultar(body) {
  return fetch(`${origin}/api/incidencias/consulta`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body), signal: AbortSignal.timeout(5000),
  });
}

// Comprueba cada identificador y la conservación de todas las columnas, incluidos null y texto.
for (const campo of ['dp_dni', 'dp_email', 'dp_apellidos']) {
  test(`POST consulta por ${campo} devuelve la fila completa y no se cachea`, async () => {
    const response = await consultar({ codigoIncidencia: fixture.id, identificador: ` ${fixture[campo]} ` });
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('cache-control'), 'no-store');
    assert.deepEqual(await response.json(), { incidencia: fixture });
  });
}

// Ningún identificador puede eludir la comprobación simultánea del id.
for (const body of [
  { codigoIncidencia: 418, identificador: fixture.dp_dni },
  { codigoIncidencia: fixture.id, identificador: 'NO-COINCIDE' },
  { codigoIncidencia: fixture.id, identificador: "' OR 1=1 --" },
]) {
  test('La pareja incorrecta responde 404 sin revelar cuál de los datos existe', async () => {
    const response = await consultar(body);
    assert.equal(response.status, 404);
    assert.equal((await response.json()).message, 'No se han encontrado los datos.');
  });
}

// Rechaza tipos inesperados, cuerpos incompletos, rangos y propiedades ajenas al DTO.
for (const body of [
  {}, { codigoIncidencia: 0, identificador: fixture.dp_dni },
  { codigoIncidencia: 2147483648, identificador: fixture.dp_dni },
  { codigoIncidencia: 1.5, identificador: fixture.dp_dni },
  { codigoIncidencia: '417', identificador: fixture.dp_dni },
  { codigoIncidencia: true, identificador: fixture.dp_dni },
  { codigoIncidencia: fixture.id, identificador: '   ' },
  { codigoIncidencia: fixture.id, identificador: 'x'.repeat(46) },
  { codigoIncidencia: fixture.id, identificador: { $ne: null } },
  { codigoIncidencia: fixture.id, identificador: fixture.dp_dni, extra: true },
]) {
  test('Una entrada no válida responde 400 antes de consultar datos', async () => {
    assert.equal((await consultar(body)).status, 400);
  });
}

/** Verifica que una avería no se presenta como ausencia de coincidencias. */
test('El fallo del servicio responde 503 con un mensaje público', async () => {
  const response = await consultar({ codigoIncidencia: fixture.id, identificador: 'SERVICIO-NO-DISPONIBLE' });
  assert.equal(response.status, 503);
  assert.equal((await response.json()).message, 'No se ha podido consultar la incidencia. Inténtalo de nuevo.');
});

/** Comprueba el límite de una fila, las columnas explícitas y la separación SQL/valores. */
test('El repositorio parametriza id y los tres identificadores', async () => {
  const identificador = "' OR 1=1 --";
  const calls = [];
  const database = {
    /** Captura una lectura sin ejecutarla ni interpolar los valores. */
    async read(sql, values) { calls.push({ sql, values }); return []; },
  };
  assert.equal(await new IncidenciasRepository(database).findByCredentials(417, identificador), null);
  assert.equal(calls.length, 1);
  assert.match(calls[0].sql, /WHERE i\.id = \? AND \(TRIM\(i\.dp_dni\) = \? OR TRIM\(i\.dp_email\) = \? OR TRIM\(i\.dp_apellidos\) = \?\)/);
  assert.match(calls[0].sql, /LEFT JOIN crm_lineas_tusgsal_amb AS l ON i\.m_linea = l\.id_linea_amb/);
  assert.match(calls[0].sql, /l\.nom_linea_tusgsal AS nom_linea_tusgsal/);
  assert.match(calls[0].sql, /LIMIT 1/);
  assert.doesNotMatch(calls[0].sql, /SELECT\s+\*/i);
  assert.ok(!calls[0].sql.includes(identificador));
  assert.deepEqual(calls[0].values, [417, identificador, identificador, identificador]);
});

/** Un fallo del driver no debe propagar mensajes con SQL, credenciales ni datos personales. */
test('DatabaseService oculta los detalles internos de un fallo de MySQL', async () => {
  const database = Object.create(DatabaseService.prototype);
  database.pool = {
    /** Simula un error que contiene información que nunca debe llegar al cliente. */
    async execute() { throw new Error('password=secreto SQL con datos privados'); },
  };
  await assert.rejects(database.read('SELECT id FROM crm_incidencia', []), (error) => {
    assert.equal(error.getStatus(), 503);
    assert.ok(!error.message.includes('secreto'));
    assert.ok(!error.message.includes('SQL'));
    return true;
  });
});
