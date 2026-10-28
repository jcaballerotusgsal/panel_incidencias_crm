import { Injectable, OnModuleDestroy, ServiceUnavailableException } from '@nestjs/common';
import { createPool, Pool, ResultSetHeader, RowDataPacket } from 'mysql2/promise';

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

  /** Cierra el pool al apagar NestJS y espera a que terminen las operaciones activas. */
  async onModuleDestroy(): Promise<void> {
    await this.pool?.end();
  }
}
