/**
 * Verifica una fecha de calendario MySQL recibida como día-mes-año, incluidos años bisiestos.
 * @param value Fecha externa todavía sin validar.
 * @returns Si tiene formato dd-mm-aaaa, año entre 1000 y 9999 y día real de ese mes.
 */
export function isFechaSuceso(value: unknown): boolean {
  if (typeof value !== 'string' || !/^\d{2}-\d{2}-\d{4}$/.test(value)) return false;
  const [dia, mes, anio] = value.split('-').map(Number);
  if (anio < 1000 || mes < 1 || mes > 12 || dia < 1) return false;
  const fecha = new Date(Date.UTC(anio, mes - 1, dia));
  return fecha.getUTCFullYear() === anio && fecha.getUTCMonth() === mes - 1 && fecha.getUTCDate() === dia;
}

/**
 * Fija una única fecha/hora de recepción en la zona del CRM utilizada por este formulario.
 * @param instante Instante del servidor al entrar en el servicio, independiente del reloj del navegador.
 * @returns Texto DATETIME de Europe/Madrid, con precisión de segundos y sin conversión posterior de MySQL.
 */
export function fechaHoraRecepcion(instante: Date): string {
  const partes = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Europe/Madrid', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
  }).formatToParts(instante);
  const valores = Object.fromEntries(partes.map((parte) => [parte.type, parte.value]));
  return `${valores.year}-${valores.month}-${valores.day} ${valores.hour}:${valores.minute}:${valores.second}`;
}
/** @param value Documento externo. @returns Si el DNI/NIE tiene formato y letra de control correctos; no acredita identidad. */
export function isDocumentoEspana(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  const documento = value.trim().toUpperCase();
  if (!/^(?:\d{8}|[XYZ]\d{7})[A-Z]$/.test(documento)) return false;
  const numero = documento.slice(0, -1).replace(/^[XYZ]/, letra => String('XYZ'.indexOf(letra)));
  return 'TRWAGMYFPDXBNJZSQVHLCKE'[Number(numero) % 23] === documento.at(-1);
}

/** @param value CP opcional. @returns Formato español de cinco cifras, provincia 01–52; no verifica una dirección real. */
export function isCodigoPostal(value: unknown): boolean {
  return typeof value === 'string' && (value === '' || /^(?:0[1-9]|[1-4]\d|5[0-2])\d{3}$/.test(value));
}

/** @param value Teléfono opcional. @returns Formato nacional de nueve cifras o internacional + y 8–15 cifras; admite separadores habituales. */
export function isTelefono(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  if (value === '') return true;
  if (!/^\+?[\d ().-]+$/.test(value)) return false;
  const numero = value.replace(/[ ().-]/g, '');
  return /^(?:[6-9]\d{8}|\+[1-9]\d{7,14})$/.test(numero);
}

/** @param value Nombre externo. @returns Texto con letras Unicode y puntuación habitual, sin números ni caracteres de control. */
export function isNombrePersona(value: unknown): boolean {
  return typeof value === 'string' && /\p{L}/u.test(value) && /^[\p{L}\p{M} .’'·-]+$/u.test(value);
}

/** @param value Dirección opcional. @returns Si contiene letras o números y no caracteres de control ni marcado HTML. */
export function isDireccion(value: unknown): boolean {
  return typeof value === 'string' && (value === '' || (/[\p{L}\p{N}]/u.test(value) && !/[<>\p{Cc}]/u.test(value)));
}
