import type { RowDataPacket } from 'mysql2/promise';

/** Valores de datos admitidos en las operaciones parametrizadas de una transacción. */
export type SqlParameter = string | number | null;

/** Operaciones disponibles en la misma conexión, sin permitir confirmar desde el repositorio. */
export interface DatabaseTransaction {
  /**
   * Lee con SQL fijo y parámetros separados dentro de la transacción actual.
   * @param sql SELECT definido por el backend.
   * @param parameters Valores recibidos y validados, nunca nombres de tablas o columnas.
   * @returns Filas de lectura; conserva las fechas como texto.
   */
  read<T extends RowDataPacket>(sql: string, parameters: readonly SqlParameter[]): Promise<T[]>;

  /**
   * Inserta exactamente una fila con clave autoincremental.
   * @param sql INSERT fijo definido por el backend.
   * @param parameters Valores de la fila, incluidos nulos explícitos.
   * @returns Id generado, únicamente si MySQL confirma una fila y un entero seguro positivo.
   */
  insert(sql: string, parameters: readonly SqlParameter[]): Promise<number>;
}
