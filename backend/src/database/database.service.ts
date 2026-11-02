import { BadRequestException, Injectable, OnModuleDestroy, ServiceUnavailableException } from '@nestjs/common';
import { createPool, Pool, PoolConnection, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { DatabaseTransaction, SqlParameter } from './database.transaction';

/** Mantiene la conexión MySQL del backend sin crear ni sincronizar objetos. */
@Injectable()
export class DatabaseService implements OnModuleDestroy {
  private readonly pool: Pool | null;

  /**
   * Prepara un pool con las variables DB_*; sin configuración, conserva la API de salud.
   * @throws Error si el puerto configurado no es válido.
   */
  constructor() {
    const { DB_HOST, DB_NAME, DB_USER, DB_PASSWORD } = process.env;
    if (!DB_HOST || !DB_NAME || !DB_USER || DB_PASSWORD === undefined) {
      this.pool = null;
      return;
    }
    const port = Number(process.env.DB_PORT ?? '3306');
    if (!Number.isInteger(port) || port < 1 || port > 65535) {
      throw new Error('DB_PORT debe ser un entero entre 1 y 65535.');
    }
    this.pool = createPool({
      host: DB_HOST,
      port,
      database: DB_NAME,
      user: DB_USER,
      password: DB_PASSWORD,
      charset: 'utf8',
      dateStrings: true,
      connectTimeout: 5000,
      connectionLimit: 4,
      queueLimit: 20,
      multipleStatements: false,
    });
  }

  /**
   * Ejecuta una lectura parametrizada con un límite de cinco segundos.
   * @param sql Consulta de lectura fija, definida en un repositorio del backend.
   * @param parameters Valores separados del SQL, nunca nombres de objetos.
   * @returns Filas devueltas por MySQL; las fechas se conservan como texto.
   * @throws ServiceUnavailableException si falta configuración o falla MySQL.
   */
  async read<T extends RowDataPacket>(sql: string, parameters: readonly (string | number)[]): Promise<T[]> {
    if (!this.pool) {
      throw new ServiceUnavailableException('La consulta de incidencias no está disponible.');
    }
    try {
      const [rows] = await this.pool.execute<T[]>({ sql, timeout: 5000 }, [...parameters]);
      return rows;
    } catch {
      // Los errores del driver pueden incluir SQL y datos personales: no se publican ni registran.
      throw new ServiceUnavailableException('No se ha podido consultar la incidencia. Inténtalo de nuevo.');
    }
  }

  /**
   * Inserta una fila mediante SQL fijo y valores parametrizados, con cinco segundos de límite.
   * @param sql INSERT definido en un repositorio del backend; no recibe SQL del navegador.
   * @param parameters Valores que se guardan, separados del texto SQL.
   * @returns Promesa resuelta después de confirmar una única fila insertada.
   * @throws ServiceUnavailableException si falta configuración o no se confirma la inserción.
   */
  async insert(sql: string, parameters: readonly (string | number)[]): Promise<void> {
    if (!this.pool) {
      throw new ServiceUnavailableException('No se ha podido registrar la consulta. Inténtalo de nuevo.');
    }
    try {
      const [result] = await this.pool.execute<ResultSetHeader>({ sql, timeout: 5000 }, [...parameters]);
      if (result.affectedRows !== 1) throw new Error('No se ha confirmado una única inserción.');
    } catch {
      // El error del driver puede contener el identificador: solo se devuelve un mensaje público.
      throw new ServiceUnavailableException('No se ha podido registrar la consulta. Inténtalo de nuevo.');
    }
  }

  /**
   * Ejecuta una operación completa en una conexión y confirma solo cuando termina sin errores.
   * @param operation Lecturas e inserciones que deben compartir transacción y orden.
   * @returns Resultado de la operación después de confirmar COMMIT.
   * @throws BadRequestException si el repositorio rechaza datos y se puede revertir la operación.
   * @throws ServiceUnavailableException ante fallos de conexión, SQL, confirmación o reversión.
   * @remarks Intenta ROLLBACK ante errores y libera la conexión; si no puede revertir, la destruye.
   */
  async transaction<T>(operation: (transaction: DatabaseTransaction) => Promise<T>): Promise<T> {
    if (!this.pool) throw new ServiceUnavailableException('No se ha podido registrar la queja. Inténtalo de nuevo.');
    let connection: PoolConnection | null = null;
    try {
      const session = await this.pool.getConnection();
      connection = session;
      await session.beginTransaction();
      const transaction: DatabaseTransaction = {
        /** Ejecuta el SELECT fijo con valores separados y timeout en esta misma conexión. */
        async read<R extends RowDataPacket>(sql: string, parameters: readonly SqlParameter[]): Promise<R[]> {
          const [rows] = await session.execute<R[]>({ sql, timeout: 5000 }, [...parameters]);
          return rows;
        },
        /** Verifica el INSERT antes de entregar su id al siguiente paso de la transacción. */
        async insert(sql: string, parameters: readonly SqlParameter[]): Promise<number> {
          const [result] = await session.execute<ResultSetHeader>({ sql, timeout: 5000 }, [...parameters]);
          if (result.affectedRows !== 1 || !Number.isSafeInteger(result.insertId) || result.insertId < 1) {
            throw new Error('No se ha confirmado una única fila con id autoincremental.');
          }
          return result.insertId;
        },
      };
      const result = await operation(transaction);
      await session.commit();
      return result;
    } catch (error: unknown) {
      let reverted = true;
      if (connection) {
        try { await connection.rollback(); } catch {
          reverted = false;
          connection.destroy();
          connection = null;
        }
      }
      if (reverted && error instanceof BadRequestException) throw error;
      // Los errores SQL y de conexión pueden contener datos personales: no se exponen ni imprimen.
      throw new ServiceUnavailableException('No se ha podido registrar la queja. Inténtalo de nuevo.');
    } finally {
      connection?.release();
    }
  }

  /** Cierra el pool al apagar NestJS y espera a que terminen las operaciones activas. */
  async onModuleDestroy(): Promise<void> {
    await this.pool?.end();
  }
}
