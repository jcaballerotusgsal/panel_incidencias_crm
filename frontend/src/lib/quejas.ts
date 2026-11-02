/** Confirmación mínima del alta, sin copiar los datos personales a otro estado del navegador. */
export interface QuejaCreada {
  codigoIncidencia: number;
  estado: 'Pendiente';
}

/**
 * Comprueba el contrato de confirmación antes de mostrar que el envío ha terminado correctamente.
 * @param value JSON externo de la API.
 * @returns Si contiene un código generado válido y el estado inicial esperado.
 */
export function isQuejaCreada(value: unknown): value is QuejaCreada {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    && 'codigoIncidencia' in value && typeof value.codigoIncidencia === 'number'
    && Number.isSafeInteger(value.codigoIncidencia) && value.codigoIncidencia > 0
    && value.codigoIncidencia <= 2147483647
    && 'estado' in value && value.estado === 'Pendiente';
}
