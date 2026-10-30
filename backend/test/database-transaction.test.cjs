require('reflect-metadata');
const assert = require('node:assert/strict');
const { test } = require('node:test');
const { BadRequestException } = require('@nestjs/common');
const { DatabaseService } = require('../dist/database/database.service');

/**
 * Construye una conexión sintética que permite comprobar el orden y simular fallos sin tocar MySQL.
 * @param options Fallos o respuestas que debe simular cada fase.
 * @returns Servicio con pool de prueba y secuencia de operaciones observadas.
 */
function fixture(options = {}) {
  const calls = [];
  const session = {
    /** Inicia la transacción sintética y permite simular un fallo de BEGIN. */
    async beginTransaction() { calls.push('begin'); if (options.beginFails) throw new Error('driver privado'); },
    /** Devuelve filas o id sintéticos, conservando la consulta y sus parámetros para verificarlos. */
    async execute(query, values) {
      calls.push({ query, values });
      if (options.executeFails) throw new Error('SQL privado identificador secreto');
      return [options.result ?? { affectedRows: 1, insertId: 123 }];
    },
    /** Confirma o simula un fallo de COMMIT. */
    async commit() { calls.push('commit'); if (options.commitFails) throw new Error('credencial privada'); },
    /** Revierte o simula una conexión que ya no puede hacer ROLLBACK. */
    async rollback() { calls.push('rollback'); if (options.rollbackFails) throw new Error('driver privado'); },
    /** Registra la devolución de la conexión al pool. */
    release() { calls.push('release'); },
    /** Registra la destrucción de una conexión que no pudo revertirse. */
    destroy() { calls.push('destroy'); },
  };
  const database = new DatabaseService();
  database.pool = {
    /** Adquiere la única conexión sintética o simula un fallo antes de obtenerla. */
    async getConnection() { calls.push('acquire'); if (options.acquireFails) throw new Error('host privado'); return session; },
  };
  return { database, calls };
}

/** El resultado solo se devuelve después de confirmar, con parámetros separados en la misma sesión. */
test('La transacción parametriza, confirma y libera antes de devolver su resultado', async () => {
  const { database, calls } = fixture();
  const result = await database.transaction(async (transaction) => {
    const id = await transaction.insert('INSERT fijo VALUES (?, ?)', ['texto sintético', null]);
    assert.equal(calls.includes('commit'), false);
    return { id };
  });
  assert.deepEqual(result, { id: 123 });
  assert.deepEqual(calls, ['acquire', 'begin', { query: { sql: 'INSERT fijo VALUES (?, ?)', timeout: 5000 }, values: ['texto sintético', null] }, 'commit', 'release']);
});

/** El SELECT del repositorio comparte conexión y timeout con las inserciones. */
test('Las lecturas transaccionales conservan filas, parámetros y conexión', async () => {
  const { database, calls } = fixture({ result: [{ id_linea_amb: 7 }] });
  const result = await database.transaction((transaction) => transaction.read('SELECT fijo WHERE id = ?', [7]));
  assert.deepEqual(result, [{ id_linea_amb: 7 }]);
  assert.deepEqual(calls[2], { query: { sql: 'SELECT fijo WHERE id = ?', timeout: 5000 }, values: [7] });
  assert.deepEqual(calls.slice(-2), ['commit', 'release']);
});

/** Cada fallo técnico debe revertir cuando hay conexión y ocultar los detalles internos. */
for (const stage of ['acquireFails', 'beginFails', 'executeFails', 'commitFails']) {
  test(`Un fallo en ${stage} no devuelve éxito y libera los recursos`, async () => {
    const { database, calls } = fixture({ [stage]: true });
    await assert.rejects(database.transaction((transaction) => transaction.insert('INSERT fijo', [])), (error) => {
      assert.equal(error.getStatus(), 503);
      assert.equal(error.message, 'No se ha podido registrar la queja. Inténtalo de nuevo.');
      return true;
    });
    if (stage === 'acquireFails') assert.deepEqual(calls, ['acquire']);
    else assert.deepEqual(calls.slice(-2), ['rollback', 'release']);
  });
}

/** La selección de una línea inválida debe conservar el 400 después de revertir. */
test('Un rechazo de negocio revierte y conserva BadRequestException', async () => {
  const { database, calls } = fixture();
  await assert.rejects(database.transaction(async () => { throw new BadRequestException('Línea no disponible.'); }), (error) => error.getStatus() === 400);
  assert.deepEqual(calls, ['acquire', 'begin', 'rollback', 'release']);
});

/** Una conexión cuyo ROLLBACK falla no debe volver al pool. */
test('Un fallo de reversión destruye la conexión y responde 503', async () => {
  const { database, calls } = fixture({ rollbackFails: true });
  await assert.rejects(database.transaction(async () => { throw new BadRequestException('Línea no disponible.'); }), (error) => error.getStatus() === 503);
  assert.deepEqual(calls, ['acquire', 'begin', 'rollback', 'destroy']);
});

/** Sin ids válidos no se puede enlazar el siguiente registro ni confirmar la operación. */
for (const result of [{ affectedRows: 0, insertId: 3 }, { affectedRows: 2, insertId: 3 }, { affectedRows: 1, insertId: 0 }, { affectedRows: 1, insertId: Number.MAX_SAFE_INTEGER + 1 }]) {
  test(`Rechaza una inserción no confirmada: ${JSON.stringify(result)}`, async () => {
    const { database, calls } = fixture({ result });
    await assert.rejects(database.transaction((transaction) => transaction.insert('INSERT fijo', [])), (error) => error.getStatus() === 503);
    assert.equal(calls.includes('commit'), false);
    assert.deepEqual(calls.slice(-2), ['rollback', 'release']);
  });
}

/** La salud puede existir sin configuración SQL; el alta debe fallar sin ejecutar el callback. */
test('Sin pool la transacción responde 503 sin empezar la operación', async () => {
  const { database, calls } = fixture();
  database.pool = null;
  await assert.rejects(database.transaction(async () => { throw new Error('No debería ejecutarse.'); }), (error) => error.getStatus() === 503);
  assert.deepEqual(calls, []);
});
