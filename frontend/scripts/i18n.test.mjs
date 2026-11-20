import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const raiz = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const [es, ca, en] = ['es', 'ca', 'en'].map(idioma =>
  JSON.parse(readFileSync(path.join(raiz, `src/messages/${idioma}.json`), 'utf8')));

/**
 * Ejecuta únicamente el módulo local de traducciones, transformado con el TypeScript del proyecto.
 * Resuelve sus tres imports JSON explícitos sin cargar Next, navegador, variables de entorno o red.
 * @returns Exportaciones reales del módulo probado, no una copia de sus algoritmos.
 */
function cargarModulo() {
  const source = readFileSync(path.join(raiz, 'src/lib/i18n.ts'), 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  });
  const exports = {};
  const datos = { '@/messages/es.json': es, '@/messages/ca.json': ca, '@/messages/en.json': en };
  // Solo código fuente del repositorio, nunca contenido externo ni plantillas de usuario.
  new Function('require', 'exports', outputText)(nombre => {
    if (!Object.hasOwn(datos, nombre)) throw new Error('Import no admitido en esta prueba.');
    return datos[nombre];
  }, exports);
  return exports;
}

const { elegirIdioma, traducir, traducirEstado } = cargarModulo();

/** Los tres idiomas deben mantenerse completos a medida que se añaden textos de interfaz. */
test('Los diccionarios contienen las mismas claves y ninguna traducción vacía', () => {
  for (const diccionario of [ca, en]) {
    assert.deepEqual(Object.keys(diccionario).sort(), Object.keys(es).sort());
    assert.ok(Object.values(diccionario).every(texto => typeof texto === 'string' && texto.trim().length > 0));
  }
});

/** Respeta elección explícita, preferencias regionales y pesos; no acepta idiomas arbitrarios. */
for (const [cookie, cabecera, esperado] of [
  ['ca', 'en-US,en;q=0.9', 'ca'], ['es', 'ca', 'es'], [undefined, 'en-GB,en;q=0.9', 'en'],
  [undefined, 'es-ES,ca;q=0.8', 'es'], [undefined, 'en;q=0.2,ca;q=0.8', 'ca'],
  ['invalida', 'fr-FR,en;q=0.7', 'en'], [undefined, 'fr-FR', 'ca'],
  [undefined, 'en;q=0,es;q=0.5', 'es'], [undefined, 'en;q=NaN,es;q=0.2', 'es'],
  [undefined, '', 'ca'], ['__proto__', '*', 'ca'],
]) {
  test(`Selección: ${JSON.stringify([cookie, cabecera])}`, () => assert.equal(elegirIdioma(cookie, cabecera), esperado));
}

/** Se traducen solo estados reconocidos y se conserva el texto histórico desconocido. */
test('Traduce estados conocidos y conserva valores ajenos al catálogo', () => {
  const t = texto => traducir('en', texto);
  assert.equal(traducirEstado(' pendiente ', t), 'Pending');
  assert.equal(traducirEstado('en revisión', t), 'Under review');
  assert.equal(traducirEstado('Estado histórico', t), 'Estado histórico');
  assert.equal(traducirEstado('__proto__', t), '__proto__');
  assert.equal(t('__proto__'), '__proto__');
});
