/** Identificador real del catálogo y texto que se presenta en el desplegable. */
export interface Linea {
  id_linea_amb: number;
  nom_linea_tusgsal: string;
}

/**
 * Comprueba una opción recibida de la API antes de usar su id o su nombre.
 * @param value Dato JSON externo, sin garantías de estructura.
 * @returns Si contiene un id entero y un nombre de línea no vacío.
 */
function isLinea(value: unknown): value is Linea {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    && 'id_linea_amb' in value && typeof value.id_linea_amb === 'number'
    && Number.isSafeInteger(value.id_linea_amb)
    && 'nom_linea_tusgsal' in value && typeof value.nom_linea_tusgsal === 'string'
    && value.nom_linea_tusgsal.trim().length > 0;
}

/**
 * Verifica el catálogo completo sin admitir ids duplicados ni opciones con nombres ausentes.
 * @param value Respuesta JSON todavía sin validar.
 * @returns Si puede utilizarse de forma segura como lista de opciones del formulario.
 */
export function isLineasResponse(value: unknown): value is { lineas: Linea[] } {
  if (typeof value !== 'object' || value === null || !('lineas' in value)) return false;
  const lineas = value.lineas;
  return Array.isArray(lineas) && lineas.every(isLinea)
    && new Set(lineas.map((linea) => linea.id_linea_amb)).size === lineas.length;
}
