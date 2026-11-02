/** Opción del catálogo: texto visible e identificador que se guarda en m_zona. */
export interface Poblacion {
  id_m_zona: number;
  poblacion: string;
}

/**
 * Verifica una población recibida de la API antes de crear su opción del desplegable.
 * @param value Dato JSON sin validar.
 * @returns Si tiene id entero seguro y nombre no vacío.
 */
function isPoblacion(value: unknown): value is Poblacion {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    && 'id_m_zona' in value && typeof value.id_m_zona === 'number' && Number.isSafeInteger(value.id_m_zona)
    && 'poblacion' in value && typeof value.poblacion === 'string' && value.poblacion.trim().length > 0;
}

/**
 * Comprueba la respuesta completa y la unicidad de ids sin agrupar nombres repetidos.
 * @param value JSON externo todavía sin validar.
 * @returns Si contiene una lista utilizable de poblaciones; una lista vacía es válida.
 */
export function isPoblacionesResponse(value: unknown): value is { poblaciones: Poblacion[] } {
  if (typeof value !== 'object' || value === null || !('poblaciones' in value)) return false;
  const poblaciones = value.poblaciones;
  return Array.isArray(poblaciones) && poblaciones.every(isPoblacion)
    && new Set(poblaciones.map((poblacion) => poblacion.id_m_zona)).size === poblaciones.length;
}
