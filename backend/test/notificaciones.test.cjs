require('reflect-metadata');
const assert = require('node:assert/strict');
const { test } = require('node:test');
const net = require('node:net');
const { NotificacionesConfig } = require('../dist/notificaciones/notificaciones.config');
const { NotificacionesRepository } = require('../dist/notificaciones/notificaciones.repository');
const { NotificacionesWorker } = require('../dist/notificaciones/notificaciones.worker');
const { CorreoService, ErrorEnvio } = require('../dist/notificaciones/correo.service');

const aviso = { id: 1, evento_id: '11111111-2222-4333-8444-555555555555', tipo_evento: 'queja_creada',
  id_incidencia: 417, id_expediente: 931, estado_anterior: null, estado_nuevo: 'Pendiente',
  tipo_destinatario: 'solicitante', destinatario: 'prueba@example.invalid', intentos: 1, token: 'reserva-sintetica' };

/** Crea configuración aislando solo variables de correo; restaura siempre el entorno del proceso. */
function config(values = {}, properties = {}) {
  const names = Object.keys(process.env).filter(name => /^(NOTIFICATIONS_|MAIL_|MS365_|SMTP_)/.test(name));
  const saved = Object.fromEntries(names.map(name => [name, process.env[name]]));
  for (const name of names) delete process.env[name];
  try {
    Object.assign(process.env, values);
    return Object.assign(new NotificacionesConfig(), properties);
  } finally {
    for (const name of Object.keys(process.env).filter(name => /^(NOTIFICATIONS_|MAIL_|MS365_|SMTP_)/.test(name))) delete process.env[name];
    Object.assign(process.env, saved);
  }
}

/** Configuración sintética válida para probar Graph sin acceder a Internet. */
function graphConfig() {
  return config({ NOTIFICATIONS_ENABLED: 'true', MAIL_FROM: 'remitente@example.invalid',
    NOTIFICATIONS_INTERNAL_TO: 'interno@example.invalid', MS365_TENANT_ID: aviso.evento_id,
    MS365_CLIENT_ID: aviso.evento_id, MS365_CLIENT_SECRET: 'secreto-sintetico' });
}

/** La API puede producir avisos sin tener credenciales del proveedor. */
test('El envío está desactivado por defecto y no exige credenciales', () => {
  const cfg = config();
  assert.equal(cfg.enabled, false);
  assert.doesNotThrow(() => cfg.validarEnvio());
  assert.doesNotThrow(() => new CorreoService(cfg));
});

/** Rechaza configuración ambigua sin revelar su contenido. */
for (const values of [{ NOTIFICATIONS_ENABLED: 'si' }, { NOTIFICATIONS_MAX_ATTEMPTS: '0' },
  { NOTIFICATIONS_INTERVAL_MS: '1' }, { MAIL_TRANSPORT: 'desconocido' },
  { NOTIFICATIONS_CONSULTATION_URL: 'https://example.invalid/?dni=secreto' }]) {
  test(`Rechaza configuración inválida de ${Object.keys(values)[0]}`, () => assert.throws(() => config(values)));
}

/** La activación de Microsoft 365 requiere una aplicación y un remitente válidos. */
test('Exige credenciales de aplicación solo al activar el emisor', () => {
  const cfg = config({ NOTIFICATIONS_ENABLED: 'true', MAIL_FROM: 'remitente@example.invalid', NOTIFICATIONS_INTERNAL_TO: 'interno@example.invalid' });
  assert.throws(() => new CorreoService(cfg), /MS365_TENANT_ID/);
  assert.doesNotThrow(() => new CorreoService(graphConfig()));
});

/** Doble transaccional que observa reservas y resultados sin acceder al CRM. */
function repositoryFixture(row, affected = 1) {
  const updates = [];
  const reads = [];
  const tx = {
    /** Captura SQL y parámetros de una actualización de reserva. */
    async update(sql, values) { updates.push({ sql, values }); return affected; },
    /** Devuelve como máximo un aviso sintético disponible. */
    async read(sql, values) { reads.push({ sql, values }); return row ? [row] : []; },
  };
  const repository = new NotificacionesRepository({ transaction: callback => callback(tx) },
    config({}, { internalTo: 'interno@example.invalid' }));
  return { repository, updates, reads };
}

/** El destinatario interno se fija en la primera reserva y no cambia en los reintentos. */
test('Reserva con token nuevo, incrementa intentos y fija el correo interno', async () => {
  const { repository, updates, reads } = repositoryFixture({ ...aviso, tipo_destinatario: 'interno', destinatario: null, intentos: 0 });
  const result = await repository.reservar();
  assert.equal(result.destinatario, 'interno@example.invalid');
  assert.equal(result.intentos, 1);
  assert.notEqual(result.token, aviso.token);
  assert.match(reads[0].sql, /NOT EXISTS[\s\S]*FOR UPDATE/);
  assert.match(updates[1].sql, /INTERVAL 120 SECOND/);
  const retry = repositoryFixture({ ...aviso, tipo_destinatario: 'interno', destinatario: 'anterior@example.invalid' });
  assert.equal((await retry.repository.reservar()).destinatario, 'anterior@example.invalid');
});

/** No confunde una cola vacía ni una reserva perdida con un envío confirmado. */
test('No reserva cuando no hay filas y exige conservar el token al confirmar', async () => {
  const empty = repositoryFixture(null);
  assert.equal(await empty.repository.reservar(), null);
  assert.equal(empty.updates.length, 1);
  const lost = repositoryFixture(aviso, 0);
  await assert.rejects(lost.repository.confirmar(aviso));
  assert.deepEqual(lost.updates[0].values, [aviso.id, aviso.token]);
});

/** Respeta la espera del proveedor y marca errores permanentes o reintentos agotados. */
for (const [attempts, permanent, retryAfter, status, delay] of [[1, false, 0, 'pendiente', 60],
  [2, false, 300, 'pendiente', 300], [5, false, 0, 'fallido', 960], [1, true, 0, 'fallido', 60]]) {
  test(`Programa fallo con intento ${attempts}, permanente=${permanent}, espera=${retryAfter}`, async () => {
    const { repository, updates } = repositoryFixture(aviso);
    await repository.rechazar({ ...aviso, intentos: attempts }, 'ERROR_SINTETICO', permanent, retryAfter);
    assert.deepEqual(updates[0].values, [status, 'ERROR_SINTETICO', delay, aviso.id, aviso.token]);
  });
}

/** Constructor del consumidor con logs silenciados para las pruebas de errores deliberados. */
function workerFixture(repository, correo, enabled = true) {
  const worker = new NotificacionesWorker(repository, correo, { enabled });
  worker.logger = { warn() {} };
  return worker;
}

/** Desactivar el envío conserva la cola sin adquirir reservas ni consumir intentos. */
test('Un consumidor desactivado no consulta MySQL', async () => {
  const worker = workerFixture({ reservar() { throw new Error('No debe consultar'); } }, {}, false);
  assert.equal(await worker.procesarLote(), 0);
});

/** Un error del solicitante no impide procesar el aviso independiente del correo interno. */
test('El consumidor aísla errores por destinatario y confirma solo los aceptados', async () => {
  const rows = [aviso, { ...aviso, id: 2, tipo_destinatario: 'interno' }];
  const confirmed = []; const failed = [];
  const worker = workerFixture({ reservar: async () => rows.shift() ?? null,
    confirmar: async row => confirmed.push(row.id), rechazar: async (...args) => failed.push(args) },
  { async enviar(row) { if (row.id === 1) throw new ErrorEnvio('ERROR_PERMANENTE', true); } });
  assert.equal(await worker.procesarLote(), 2);
  assert.deepEqual(confirmed, [2]);
  assert.deepEqual(failed[0].slice(1), ['ERROR_PERMANENTE', true, 0]);
});

/** Perder la confirmación SQL tras aceptar el proveedor no se registra como rechazo del correo. */
test('Un fallo de confirmación conserva la reserva sin rechazar un envío aceptado', async () => {
  let rejected = false;
  const worker = workerFixture({ reservar: async () => aviso, confirmar: async () => { throw new Error('SQL'); },
    rechazar: async () => { rejected = true; } }, { enviar: async () => {} });
  await assert.rejects(worker.procesarLote());
  assert.equal(rejected, false);
});

/** Evita lotes concurrentes y deja terminar el envío activo al detenerse. */
test('El consumidor no solapa lotes ni adquiere más trabajo al apagar', async () => {
  let finish; let entered;
  const sending = new Promise(resolve => { entered = resolve; });
  const wait = new Promise(resolve => { finish = resolve; });
  let reservations = 0;
  const worker = workerFixture({ reservar: async () => { reservations++; return aviso; }, confirmar: async () => {} },
    { enviar: async () => { entered(); await wait; } });
  const first = worker.procesarLote();
  await sending;
  assert.equal(await worker.procesarLote(), 0);
  worker.detener(); finish();
  assert.equal(await first, 1);
  assert.equal(reservations, 1);
});

/** Dobla fetch durante cada prueba; nunca alcanza los servidores reales de Microsoft. */
test('Graph envía por separado, reutiliza el token y limita el contenido del mensaje', async t => {
  const calls = [];
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    calls.push({ url, options });
    return url.includes('login.microsoftonline.com') ? Response.json({ access_token: 'token-sintetico', expires_in: 3600 }) : new Response(null, { status: 202 });
  });
  const correo = new CorreoService(graphConfig());
  await correo.enviar(aviso);
  await correo.enviar({ ...aviso, tipo_destinatario: 'interno', destinatario: 'interno@example.invalid' });
  assert.equal(calls.length, 3);
  assert.equal(calls[0].options.body.get('scope'), 'https://graph.microsoft.com/.default');
  assert.equal(calls[0].options.body.get('grant_type'), 'client_credentials');
  const message = JSON.parse(calls[1].options.body).message;
  assert.deepEqual(message.toRecipients, [{ emailAddress: { address: aviso.destinatario } }]);
  assert.equal(message.ccRecipients, undefined);
  assert.match(message.body.content, /417/);
  assert.equal(message.body.content.includes('prueba@example.invalid'), false);
  assert.match(calls[1].url, /users\/remitente%40example.invalid\/sendMail$/);
});

/** El worker recibe solo códigos seguros y sabe distinguir límites temporales y permisos denegados. */
for (const [status, permanent, retryAfter] of [[403, true, 0], [429, false, 120], [503, false, 0]]) {
  test(`Graph clasifica HTTP ${status} sin propagar la respuesta externa`, async t => {
    t.mock.method(globalThis, 'fetch', async url => url.includes('login.microsoftonline.com')
      ? Response.json({ access_token: 'token-sintetico', expires_in: 3600 })
      : new Response('datos privados del proveedor', { status, headers: retryAfter ? { 'Retry-After': String(retryAfter) } : {} }));
    await assert.rejects(new CorreoService(graphConfig()).enviar(aviso), error => {
      assert.equal(error.message, 'MS365_ENVIO'); assert.equal(error.permanent, permanent); assert.equal(error.retryAfter, retryAfter); return true;
    });
  });
}

/** Un 401 provoca adquirir un token nuevo en el siguiente intento. */
test('Graph invalida un token rechazado', async t => {
  let tokens = 0; let sends = 0;
  t.mock.method(globalThis, 'fetch', async url => {
    if (url.includes('login.microsoftonline.com')) { tokens++; return Response.json({ access_token: 'token-sintetico', expires_in: 3600 }); }
    return new Response(null, { status: ++sends === 1 ? 401 : 202 });
  });
  const correo = new CorreoService(graphConfig());
  await assert.rejects(correo.enviar(aviso), error => error.permanent === false);
  await correo.enviar(aviso);
  assert.equal(tokens, 2);
});

/** Buzones mal formados no desencadenan llamadas al proveedor. */
test('Un destinatario inválido falla de forma permanente antes de la red', async t => {
  t.mock.method(globalThis, 'fetch', () => { throw new Error('No debe llegar a la red'); });
  await assert.rejects(new CorreoService(graphConfig()).enviar({ ...aviso, destinatario: null }),
    error => error.code === 'AVISO_INVALIDO' && error.permanent);
});

/** Servidor SMTP mínimo sobre loopback: captura sobres y mensajes sin entregarlos a Internet. */
async function smtpFixture() {
  const messages = [];
  const sockets = new Set();
  const server = net.createServer(socket => {
    sockets.add(socket); socket.on('close', () => sockets.delete(socket));
    socket.write('220 localhost prueba SMTP\r\n');
    let buffer = ''; let data = false; let lines = []; let recipients = [];
    socket.on('data', chunk => {
      buffer += chunk.toString();
      while (buffer.includes('\r\n')) {
        const index = buffer.indexOf('\r\n'); const line = buffer.slice(0, index); buffer = buffer.slice(index + 2);
        if (data) {
          if (line !== '.') { lines.push(line); continue; }
          messages.push({ recipients, text: lines.join('\n') }); data = false; lines = []; recipients = []; socket.write('250 Aceptado\r\n');
        } else if (/^EHLO/.test(line)) socket.write('250-localhost\r\n250 8BITMIME\r\n');
        else if (/^RCPT TO:/.test(line)) { recipients.push(line); socket.write('250 OK\r\n'); }
        else if (line === 'DATA') { data = true; socket.write('354 Finalizar con punto\r\n'); }
        else if (line === 'QUIT') socket.end('221 Cerrado\r\n');
        else socket.write('250 OK\r\n');
      }
    });
  });
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
  return { port: server.address().port, messages,
    /** Cierra todas las conexiones locales incluso si falla una aserción. */
    async close() { for (const socket of sockets) socket.destroy(); await new Promise(resolve => server.close(resolve)); } };
}

/** Prueba el transporte real de Nodemailer contra un SMTP local sin TLS solo para esta prueba aislada. */
test('SMTP entrega dos mensajes independientes al servidor de prueba local', async () => {
  const smtp = await smtpFixture();
  const correo = new CorreoService(config({ NOTIFICATIONS_ENABLED: 'true', MAIL_TRANSPORT: 'smtp',
    MAIL_FROM: 'remitente@example.invalid', NOTIFICATIONS_INTERNAL_TO: 'interno@example.invalid',
    SMTP_HOST: '127.0.0.1', SMTP_PORT: String(smtp.port), SMTP_REQUIRE_TLS: 'false' }));
  try {
    await correo.enviar(aviso);
    await correo.enviar({ ...aviso, tipo_destinatario: 'interno', destinatario: 'interno@example.invalid' });
    assert.equal(smtp.messages.length, 2);
    assert.equal(smtp.messages[0].recipients.length, 1);
    assert.match(smtp.messages[0].recipients[0], /prueba@example.invalid/);
    assert.match(smtp.messages[1].recipients[0], /interno@example.invalid/);
    const firstId = /Message-ID:\s*(<[^>]+>)/i.exec(smtp.messages[0].text);
    const secondId = /Message-ID:\s*(<[^>]+>)/i.exec(smtp.messages[1].text);
    assert.ok(firstId); assert.ok(secondId);
    assert.notEqual(firstId[1], secondId[1]);
  } finally { correo.cerrar(); await smtp.close(); }
});
