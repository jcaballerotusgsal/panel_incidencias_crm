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
