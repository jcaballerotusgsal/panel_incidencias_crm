/** Columnas escalares del CRM y lista explícita de estados de los expedientes relacionados. */
export type Incidencia = {
  id: number;
  nom_linea_tusgsal: string | null;
  estados_expedientes: (string | null)[];
} & Record<string, string | number | null | (string | null)[]>;

export type ResultadoConsulta =
  | { estado: 'encontrada'; incidencia: Incidencia }
  | { estado: 'no-encontrada' };

/**
 * Verifica el JSON externo antes de guardarlo o mostrar sus columnas.
 * @param value Respuesta de la API todavía sin validar.
 * @returns Si contiene id positivo, línea, estados como texto o null y el resto de columnas escalares.
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
    && 'estados_expedientes' in incidencia
    && Array.isArray(incidencia.estados_expedientes)
    && incidencia.estados_expedientes.every((estado: unknown) => estado === null || typeof estado === 'string')
    // Solo esta propiedad admite listas; otros campos nuevos deben seguir siendo escalares.
    && Object.entries(incidencia).every(([clave, campo]: [string, unknown]) => clave === 'estados_expedientes'
      || campo === null
      || typeof campo === 'string'
      || (typeof campo === 'number' && Number.isFinite(campo)));
}
