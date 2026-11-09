import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { Notificacion } from './notificacion';

/** Error seguro que permite reintentar un aviso tras corregir su plantilla, sin revelar datos. */
export class ErrorPlantillaCorreo extends Error {
  /** Identifica un archivo ausente o una plantilla inválida sin conservar su contenido ni ruta. */
  constructor() { super('PLANTILLA_CORREO_INVALIDA'); }
}

/**
 * Lee la plantilla en cada envío: original en desarrollo y distribuida en los demás modos.
 * @param aviso Evento reservado. @param urlConsulta Enlace general configurado, opcional.
 * @returns HTML con datos escapados; no lee una ruta elegida por el usuario ni almacena caché.
 * @throws ErrorPlantillaCorreo si falta el archivo, no se puede leer o su sintaxis no es válida.
 */
export async function crearHtmlCorreoUsuario(aviso: Notificacion, urlConsulta: string): Promise<string> {
  try {
    const ruta = process.env.NODE_ENV === 'development'
      ? join(__dirname, '..', '..', 'src', 'notificaciones', 'plantillas', 'usuario.html')
      : join(__dirname, 'plantillas', 'usuario.html');
    const plantilla = await readFile(ruta, 'utf8');
    return renderizarPlantillaUsuario(plantilla, aviso, urlConsulta);
  } catch { throw new ErrorPlantillaCorreo(); }
}

/**
 * Sustituye variables y bloques opcionales sin evaluar código ni introducir HTML de los datos.
 * @param plantilla HTML editable; admite {{variable}} y bloques {{#condicion}}…{{/condicion}}.
 * @param aviso Evento cuyos únicos datos visibles son código y estados.
 * @param urlConsulta URL HTTP(S) general sin credenciales, parámetros ni fragmento, o cadena vacía.
 * @returns Documento HTML; las variables no se vuelven a interpretar tras sustituirlas.
 * @throws ErrorPlantillaCorreo ante variables/bloques desconocidos, cierres incorrectos o URL inválida.
 */
export function renderizarPlantillaUsuario(plantilla: string, aviso: Notificacion, urlConsulta: string): string {
  if (!plantilla.trim() || !['queja_creada', 'estado_cambiado'].includes(aviso.tipo_evento)
    || !Number.isSafeInteger(aviso.id_incidencia) || aviso.id_incidencia < 1) throw new ErrorPlantillaCorreo();
  const cambioEstado = aviso.tipo_evento === 'estado_cambiado';
  const url = normalizarUrl(urlConsulta);
  const variables = new Map<string, string>([
    ['codigoIncidencia', String(aviso.id_incidencia)],
    ['titulo', cambioEstado ? 'Tu incidencia ha cambiado de estado' : 'Hemos recibido tu queja'],
    ['mensaje', cambioEstado ? 'Te informamos de una actualización en el estado de tu incidencia.'
      : 'Tu queja se ha registrado correctamente. Conserva este código para consultar su información.'],
    ['estadoAnterior', aviso.estado_anterior ?? 'No informado'],
    ['estadoActual', aviso.estado_nuevo ?? 'No informado'],
    ['urlConsulta', url],
  ]);
  const condiciones = new Map([['quejaCreada', !cambioEstado], ['cambioEstado', cambioEstado], ['enlaceConsulta', Boolean(url)]]);
  const pila: { nombre: string; visible: boolean }[] = [];
  let visible = true;
  let cursor = 0;
  let html = '';
  // Los marcadores de bloque pueden ir dentro de comentarios para abrir el archivo como HTML.
  const patron = /<!--\s*({{[\s\S]*?}})\s*-->|({{[\s\S]*?}})/g;
  for (const coincidencia of plantilla.matchAll(patron)) {
    const texto = plantilla.slice(cursor, coincidencia.index);
    comprobarTexto(texto);
    if (visible) html += texto;
    const token = (coincidencia[1] ?? coincidencia[2]).slice(2, -2).trim();
    if (token.startsWith('#')) {
      const nombre = token.slice(1).trim();
      if (!condiciones.has(nombre)) throw new ErrorPlantillaCorreo();
      pila.push({ nombre, visible });
      visible = visible && condiciones.get(nombre) === true;
    } else if (token.startsWith('/')) {
      const anterior = pila.pop();
      if (!anterior || anterior.nombre !== token.slice(1).trim()) throw new ErrorPlantillaCorreo();
      visible = anterior.visible;
    } else {
      const valor = variables.get(token);
      if (valor === undefined) throw new ErrorPlantillaCorreo();
      if (visible) html += escaparHtml(valor);
    }
    cursor = coincidencia.index + coincidencia[0].length;
  }
  const final = plantilla.slice(cursor);
  comprobarTexto(final);
  if (pila.length !== 0) throw new ErrorPlantillaCorreo();
  html += final;
  if (!html.trim()) throw new ErrorPlantillaCorreo();
  return html;
}

/**
 * Escapa texto y atributos HTML para evitar que un estado del CRM se convierta en marcado.
 * @param valor Texto original. @returns Texto con &, <, >, comillas y apóstrofos codificados.
 */
function escaparHtml(valor: string): string {
  const entidades: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  return valor.replace(/[&<>"']/g, caracter => entidades[caracter] ?? caracter);
}

/** @param texto Fragmento literal. @throws ErrorPlantillaCorreo si contiene un marcador incompleto. */
function comprobarTexto(texto: string): void {
  if (texto.includes('{{') || texto.includes('}}')) throw new ErrorPlantillaCorreo();
}

/**
 * Verifica también el contexto del enlace para que una variable no introduzca esquemas ejecutables.
 * @param valor URL general o cadena vacía. @returns URL normalizada o cadena vacía.
 * @throws ErrorPlantillaCorreo si no cumple las mismas restricciones que la configuración de correo.
 */
function normalizarUrl(valor: string): string {
  if (!valor) return '';
  try {
    const url = new URL(valor);
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash) throw new Error();
    return url.href;
  } catch { throw new ErrorPlantillaCorreo(); }
}
