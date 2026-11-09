const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs/promises');
const { crearHtmlCorreoUsuario, renderizarPlantillaUsuario, ErrorPlantillaCorreo } = require('../dist/notificaciones/plantilla-correo');

const alta = { id_incidencia: 417, tipo_evento: 'queja_creada', estado_anterior: null, estado_nuevo: 'Pendiente' };

/** Verifica el archivo real copiado por Nest y los bloques opcionales del alta. */
test('La compilación distribuye la plantilla y el alta incluye código/estado/enlace sin estado anterior', async () => {
  const mode = process.env.NODE_ENV;
  let html;
  try {
    process.env.NODE_ENV = 'production';
    html = await crearHtmlCorreoUsuario(alta, 'https://example.invalid/consulta');
  } finally {
    if (mode === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = mode;
  }
  assert.match(html, /<!DOCTYPE html>/i);
  assert.match(html, /DIREXIS TUSGSAL/);
  assert.match(html, /#f5a810/);
  assert.match(html, /#417/);
  assert.match(html, /Hemos recibido tu queja/);
  assert.match(html, /Pendiente/);
  assert.match(html, /href="https:\/\/example.invalid\/consulta"/);
  assert.equal(html.includes('Estado anterior'), false);
  assert.equal(html.includes('{{'), false);
});

/** El archivo se vuelve a leer para aplicar los cambios de HTML en el siguiente envío. */
test('Editar el HTML cambia el siguiente correo sin una caché de contenido', async t => {
  let content = '<p>Primera versión {{codigoIncidencia}}</p>';
  const read = t.mock.method(fs, 'readFile', async () => content);
  assert.equal(await crearHtmlCorreoUsuario(alta, ''), '<p>Primera versión 417</p>');
  content = '<h1>Mi formato {{codigoIncidencia}}</h1>';
  assert.equal(await crearHtmlCorreoUsuario(alta, ''), '<h1>Mi formato 417</h1>');
  assert.equal(read.mock.callCount(), 2);
});

/** La imagen compilada y el montaje de desarrollo utilizan sus respectivas rutas fijas. */
test('Desarrollo lee el HTML original y producción la copia compilada', async t => {
  const paths = [];
  t.mock.method(fs, 'readFile', async file => { paths.push(file); return '<p>{{codigoIncidencia}}</p>'; });
  const mode = process.env.NODE_ENV;
  try {
    process.env.NODE_ENV = 'development';
    await crearHtmlCorreoUsuario(alta, '');
    process.env.NODE_ENV = 'production';
    await crearHtmlCorreoUsuario(alta, '');
    assert.match(paths[0], /[/\\]src[/\\]notificaciones[/\\]plantillas[/\\]usuario\.html$/);
    assert.match(paths[1], /[/\\]dist[/\\]notificaciones[/\\]plantillas[/\\]usuario\.html$/);
  } finally {
    if (mode === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = mode;
  }
});

/** Un estado del CRM nunca puede inyectar una etiqueta o un atributo en el correo. */
test('El cambio de estado escapa datos e incluye el anterior sin volver a evaluar sus marcadores', () => {
  const html = renderizarPlantillaUsuario('<p>{{estadoActual}}</p><!-- {{#cambioEstado}} --><p>{{estadoAnterior}}</p><!-- {{/cambioEstado}} -->',
    { ...alta, tipo_evento: 'estado_cambiado', estado_nuevo: '<img src=x onerror="1"> & \'', estado_anterior: '{{titulo}}' }, '');
  assert.equal(html, '<p>&lt;img src=x onerror=&quot;1&quot;&gt; &amp; &#39;</p><p>{{titulo}}</p>');
});

/** Sin enlace configurado no aparece un botón vacío ni información de acceso inventada. */
test('La plantilla de cambio maneja estados nulos y omite el bloque de enlace si falta la URL', async () => {
  const html = await crearHtmlCorreoUsuario({ ...alta, tipo_evento: 'estado_cambiado', estado_anterior: null, estado_nuevo: null }, '');
  assert.match(html, /Tu incidencia ha cambiado de estado/);
  assert.match(html, /Estado anterior/);
  assert.match(html, /No informado/);
  assert.equal(html.includes('href='), false);
  assert.equal(html.includes('Consultar incidencia'), false);
});

/** Los bloques se pueden anidar sin mostrar contenido de una condición falsa. */
test('Los bloques opcionales conservan el ámbito y los textos externos', () => {
  const html = renderizarPlantillaUsuario('A{{#cambioEstado}}B{{#enlaceConsulta}}C{{/enlaceConsulta}}D{{/cambioEstado}}E', alta, 'https://example.invalid');
  assert.equal(html, 'AE');
});

/** Permite personalizar los textos de ambos eventos exclusivamente en el archivo HTML. */
test('El mismo archivo admite diseños distintos para alta y cambio de estado', () => {
  const plantilla = '<!-- {{#quejaCreada}} --><h1>Gracias por contactarnos</h1><!-- {{/quejaCreada}} -->'
    + '<!-- {{#cambioEstado}} --><h2>Actualización de {{codigoIncidencia}}</h2><!-- {{/cambioEstado}} -->';
  assert.equal(renderizarPlantillaUsuario(plantilla, alta, ''), '<h1>Gracias por contactarnos</h1>');
  assert.equal(renderizarPlantillaUsuario(plantilla, { ...alta, tipo_evento: 'estado_cambiado' }, ''), '<h2>Actualización de 417</h2>');
});

/** Errores de edición se comunican antes del envío y sin incluir datos privados de la plantilla. */
for (const plantilla of ['', '{{nombre}}', '{{constructor}}', '{{#desconocido}}x{{/desconocido}}',
  '{{#cambioEstado}}x', '{{/cambioEstado}}', '{{#cambioEstado}}x{{/enlaceConsulta}}',
  '{{codigoIncidencia', '{{{codigoIncidencia}}}', '{{#cambioEstado}}{{privado}}{{/cambioEstado}}']) {
  test(`Rechaza sintaxis o variables no admitidas: ${JSON.stringify(plantilla)}`, () => {
    assert.throws(() => renderizarPlantillaUsuario(plantilla, alta, ''), error => error instanceof ErrorPlantillaCorreo && error.message === 'PLANTILLA_CORREO_INVALIDA');
  });
}

/** Mantiene las restricciones de la URL de consulta al construir href dentro de HTML. */
for (const url of ['javascript:alert(1)', 'data:text/html,privado', 'https://usuario:clave@example.invalid',
  'https://example.invalid/?dni=privado', 'https://example.invalid/#privado']) {
  test(`Rechaza un enlace no permitido (${new URL(url).protocol})`, () => {
    assert.throws(() => renderizarPlantillaUsuario('<a href="{{urlConsulta}}">Consultar</a>', alta, url), ErrorPlantillaCorreo);
  });
}

/** Los fallos del sistema de archivos no revelan ruta, permisos ni contenido. */
test('Un archivo ausente produce un error seguro de plantilla', async t => {
  t.mock.method(fs, 'readFile', async () => { throw new Error('Ruta y datos privados'); });
  await assert.rejects(crearHtmlCorreoUsuario(alta, ''), error => error.message === 'PLANTILLA_CORREO_INVALIDA');
});
