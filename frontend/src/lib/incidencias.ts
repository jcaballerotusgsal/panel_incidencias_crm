/** Valores JSON admitidos en las columnas de la incidencia devuelta por la API. */
export type Incidencia = { id: number; nom_linea_tusgsal: string | null } & Record<string, string | number | null>;

export type ResultadoConsulta =
  | { estado: 'encontrada'; incidencia: Incidencia }
  | { estado: 'no-encontrada' };

/**
 * Verifica el JSON externo antes de guardarlo o mostrar sus columnas.
 * @param value Respuesta de la API todavía sin validar.
 * @returns Si contiene id positivo, nombre de línea como texto o null y columnas escalares.
 */
export function isConsultaResponse(value: unknown): value is { incidencia: Incidencia } {
  if (typeof value !== 'object' || value === null || !('incidencia' in value)) return false;
  const incidencia = value.incidencia;
  if (typeof incidencia !== 'object' || incidencia === null || Array.isArray(incidencia)) return false;
  return 'id' in incidencia
    && typeof incidencia.id === 'number'
    && Number.isInteger(incidencia.id)
    && incidencia.id > 0
    && 'nom_linea_tusgsal' in incidencia
    && (incidencia.nom_linea_tusgsal === null || typeof incidencia.nom_linea_tusgsal === 'string')
    && Object.values(incidencia).every((campo: unknown) => campo === null
      || typeof campo === 'string'
      || (typeof campo === 'number' && Number.isFinite(campo)));
}
