require('reflect-metadata');
const assert = require('node:assert/strict');
const { test, before, beforeEach, after } = require('node:test');
const { Module, ValidationPipe, ServiceUnavailableException } = require('@nestjs/common');
const { NestFactory } = require('@nestjs/core');
const { IncidenciasController } = require('../dist/incidencias/incidencias.controller');
const { IncidenciasService } = require('../dist/incidencias/incidencias.service');
const { IncidenciasRepository } = require('../dist/incidencias/incidencias.repository');
const { DatabaseService } = require('../dist/database/database.service');
const { LogsConsultasRepository } = require('../dist/incidencias/logs-consultas.repository');

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

const consultas = [];
const logs = [];
let failLog = false;
const logRepository = {
  /** Captura una escritura sintética o simula su fallo sin acceder a MySQL. */
  async registrar(fechaHoraPeticion, codigoIncidencia, identificador, valida) {
    if (failLog) throw new ServiceUnavailableException('No se ha podido registrar la consulta. Inténtalo de nuevo.');
    logs.push({ fechaHoraPeticion, codigoIncidencia, identificador, valida });
  },
};

const repository = {
  /** Simula únicamente la coincidencia de id e identificador, incluidos fallos del servicio. */
  async findByCredentials(id, identificador) {
    consultas.push({ id, identificador });
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
  providers: [
    IncidenciasService,
    { provide: IncidenciasRepository, useValue: repository },
    { provide: LogsConsultasRepository, useValue: logRepository },
  ],
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

/** Aísla los registros y fallos simulados de cada petición de prueba. */
beforeEach(() => { consultas.length = 0; logs.length = 0; failLog = false; });

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

/** Comprueba la fila completa y un único log válido con las entradas sin recortar. */
for (const campo of ['dp_dni', 'dp_email', 'dp_apellidos']) {
  test(`POST consulta por ${campo} devuelve la fila completa y no se cachea`, async () => {
    const response = await consultar({ codigoIncidencia: fixture.id, identificador: ` ${fixture[campo]} ` });
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('cache-control'), 'no-store');
    assert.deepEqual(await response.json(), { incidencia: fixture });
    assert.equal(logs.length, 1);
    assert.equal(logs[0].codigoIncidencia, String(fixture.id));
    assert.equal(logs[0].identificador, ` ${fixture[campo]} `);
    assert.equal(logs[0].valida, true);
    assert.ok(logs[0].fechaHoraPeticion instanceof Date);
  });
}

/** La pareja incorrecta registra el intento fallido y conserva el mensaje público existente. */
for (const body of [
  { codigoIncidencia: 418, identificador: fixture.dp_dni },
  { codigoIncidencia: fixture.id, identificador: 'NO-COINCIDE' },
  { codigoIncidencia: fixture.id, identificador: "' OR 1=1 --" },
]) {
  test('La pareja incorrecta responde 404 sin revelar cuál de los datos existe', async () => {
    const response = await consultar(body);
    assert.equal(response.status, 404);
    assert.equal((await response.json()).message, 'No se han encontrado los datos.');
    assert.equal(logs.length, 1);
    assert.equal(logs[0].valida, false);
    assert.equal(logs[0].codigoIncidencia, String(body.codigoIncidencia));
    assert.equal(logs[0].identificador, body.identificador);
  });
}

/** Rechaza entradas inválidas antes de ejecutar lecturas o escrituras. */
for (const body of [
  {}, { codigoIncidencia: 0, identificador: fixture.dp_dni },
  { codigoIncidencia: 2147483648, identificador: fixture.dp_dni },
  { codigoIncidencia: 1.5, identificador: fixture.dp_dni },
  { codigoIncidencia: '1e2', identificador: fixture.dp_dni },
  { codigoIncidencia: '1.5', identificador: fixture.dp_dni },
  { codigoIncidencia: '2147483648', identificador: fixture.dp_dni },
  { codigoIncidencia: '00000000417', identificador: fixture.dp_dni },
  { codigoIncidencia: ' 417 ', identificador: fixture.dp_dni },
  { codigoIncidencia: '-417', identificador: fixture.dp_dni },
  { codigoIncidencia: '', identificador: fixture.dp_dni },
  { codigoIncidencia: '0', identificador: fixture.dp_dni },
  { codigoIncidencia: true, identificador: fixture.dp_dni },
  { codigoIncidencia: fixture.id, identificador: '   ' },
  { codigoIncidencia: fixture.id, identificador: 'x'.repeat(46) },
  { codigoIncidencia: fixture.id, identificador: { $ne: null } },
  { codigoIncidencia: fixture.id, identificador: fixture.dp_dni, extra: true },
  { codigoIncidencia: fixture.id, identificador: fixture.dp_dni, Valida: true },
]) {
  test('Una entrada no válida responde 400 antes de consultar datos', async () => {
    assert.equal((await consultar(body)).status, 400);
    assert.equal(consultas.length, 0);
    assert.equal(logs.length, 0);
  });
}

/** Registra una lectura fallida como no válida y conserva el error público de servicio. */
test('El fallo del servicio responde 503 con un mensaje público', async () => {
  const response = await consultar({ codigoIncidencia: fixture.id, identificador: 'SERVICIO-NO-DISPONIBLE' });
  assert.equal(response.status, 503);
  assert.equal((await response.json()).message, 'No se ha podido consultar la incidencia. Inténtalo de nuevo.');
  assert.equal(logs.length, 1);
  assert.equal(logs[0].valida, false);
});

/** Conserva ceros iniciales y espacios en el log, usando un número y texto recortado para buscar. */
test('El código de texto consulta el id numérico y se registra sin perder su representación', async () => {
  const started = Date.now();
  const response = await consultar({ codigoIncidencia: '00417', identificador: ` ${fixture.dp_dni} ` });
  assert.equal(response.status, 200);
  assert.deepEqual(consultas, [{ id: fixture.id, identificador: fixture.dp_dni }]);
  assert.equal(logs.length, 1);
  assert.equal(logs[0].codigoIncidencia, '00417');
  assert.equal(logs[0].identificador, ` ${fixture.dp_dni} `);
  assert.equal(logs[0].valida, true);
  assert.ok(logs[0].fechaHoraPeticion.getTime() >= started);
  assert.ok(logs[0].fechaHoraPeticion.getTime() <= Date.now());
});

/** Cada envío es un intento distinto, aunque coincidan los dos datos de entrada. */
test('Dos consultas iguales generan dos logs independientes', async () => {
  const body = { codigoIncidencia: fixture.id, identificador: fixture.dp_dni };
  assert.equal((await consultar(body)).status, 200);
  assert.equal((await consultar(body)).status, 200);
  assert.equal(logs.length, 2);
});

/** No permite devolver la incidencia como éxito si no se ha podido guardar el log. */
test('Un fallo de escritura responde 503 sin devolver la incidencia', async () => {
  failLog = true;
  const response = await consultar({ codigoIncidencia: fixture.id, identificador: fixture.dp_dni });
  assert.equal(response.status, 503);
  const body = await response.json();
  assert.equal(body.message, 'No se ha podido registrar la consulta. Inténtalo de nuevo.');
  assert.equal(body.incidencia, undefined);
});

/** La confirmación de escritura forma parte de la consulta y se espera antes de resolverla. */
test('El servicio espera la confirmación del log antes de responder', async () => {
  let confirmLog;
  let logStarted;
  const started = new Promise((resolve) => { logStarted = resolve; });
  const saved = new Promise((resolve) => { confirmLog = resolve; });
  const service = new IncidenciasService(repository, {
    /** Permite controlar cuándo MySQL habría confirmado la inserción. */
    registrar() { logStarted(); return saved; },
  });
  let completed = false;
  const result = service.consultar({ codigoIncidencia: fixture.id, identificador: fixture.dp_dni })
    .then((value) => { completed = true; return value; });
  await started;
  assert.equal(completed, false);
  confirmLog();
  assert.deepEqual(await result, { incidencia: fixture });
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

/** El INSERT parametrizado guarda UTC, el texto original y solo 0/1, sin interpolar entradas. */
test('El repositorio de logs separa SQL y datos y guarda la fecha de petición en UTC', async () => {
  const calls = [];
  const repository = new LogsConsultasRepository({
    /** Captura las inserciones sin ejecutarlas contra MySQL. */
    async insert(sql, values) { calls.push({ sql, values }); },
  });
  const fecha = new Date('2026-10-28T12:34:56.789+02:00');
  const identificador = " ' OR 1=1 -- ";
  await repository.registrar(fecha, '00417', identificador, true);
  await repository.registrar(fecha, '00417', identificador, false);
  assert.equal(calls.length, 2);
  assert.match(calls[0].sql, /INSERT INTO crm_logs_consulta_incidencias/);
  assert.ok(!calls[0].sql.includes(identificador));
  assert.deepEqual(calls[0].values, ['2026-10-28 10:34:56', '00417', identificador, 1]);
  assert.deepEqual(calls[1].values, ['2026-10-28 10:34:56', '00417', identificador, 0]);
});

/** Un fallo de inserción nunca expone SQL o identificadores en la excepción pública. */
test('DatabaseService oculta los detalles internos de los errores de escritura', async () => {
  const database = Object.create(DatabaseService.prototype);
  database.pool = {
    /** Simula un error del driver con contenido que no debe llegar a la respuesta. */
    async execute() { throw new Error('SQL INSERT Identificador=privado password=secreto'); },
  };
  await assert.rejects(database.insert('INSERT INTO crm_logs_consulta_incidencias VALUES (?)', ['privado']), (error) => {
    assert.equal(error.getStatus(), 503);
    assert.equal(error.message, 'No se ha podido registrar la consulta. Inténtalo de nuevo.');
    return true;
  });
});

/** Detecta una inserción no confirmada y la configuración ausente, en vez de omitir logs. */
test('DatabaseService exige una única inserción confirmada y una conexión configurada', async () => {
  const database = Object.create(DatabaseService.prototype);
  database.pool = {
    /** Simula un comando que no ha insertado ninguna fila. */
    async execute() { return [{ affectedRows: 0 }]; },
  };
  await assert.rejects(database.insert('INSERT INTO crm_logs_consulta_incidencias VALUES (?)', ['sintetico']), { status: 503 });
  database.pool = null;
  await assert.rejects(database.insert('INSERT INTO crm_logs_consulta_incidencias VALUES (?)', ['sintetico']), { status: 503 });
});
