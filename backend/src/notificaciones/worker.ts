import 'reflect-metadata';
import { Logger, Module } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NotificacionesModule } from './notificaciones.module';
import { NotificacionesConfig } from './notificaciones.config';
import { NotificacionesWorker } from './notificaciones.worker';
import { CorreoService } from './correo.service';

@Module({ imports: [NotificacionesModule], providers: [CorreoService, NotificacionesWorker] })
class WorkerModule {}

/** Inicia el consumidor sin puerto HTTP y espera el lote activo antes de cerrar SMTP y MySQL. */
async function bootstrap(): Promise<void> {
  const app = await NestFactory.createApplicationContext(WorkerModule, { logger: ['error', 'warn', 'log'] });
  const worker = app.get(NotificacionesWorker);
  const config = app.get(NotificacionesConfig);
  const logger = new Logger('CorreoWorker');
  let stopping = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let current: Promise<void> = Promise.resolve();
  /** Ejecuta el siguiente lote y programa la siguiente revisión sin solapamientos. */
  async function tick(): Promise<void> {
    if (stopping) return;
    try { await worker.procesarLote(); } catch { logger.error('No se ha podido procesar la cola de correo.'); }
    if (!stopping) timer = setTimeout(() => { current = tick(); }, config.intervalMs);
  }
  /** Completa el lote activo antes de cerrar conexiones, sin eliminar pendientes. */
  async function stop(): Promise<void> {
    if (stopping) return;
    stopping = true;
    worker.detener();
    if (timer) clearTimeout(timer);
    await current;
    app.get(CorreoService).cerrar();
    await app.close();
  }
  /** Cierra recursos ante una señal y comunica fallos sin exponer datos del proveedor. */
  function stopSafely(): void {
    void stop().catch(() => { logger.error('No se ha podido completar el cierre del consumidor.'); process.exitCode = 1; });
  }
  process.once('SIGTERM', stopSafely);
  process.once('SIGINT', stopSafely);
  logger.log(config.enabled ? 'Consumidor de correo activado.' : 'Envío desactivado; los avisos permanecen pendientes.');
  current = tick();
}

void bootstrap().catch(() => { Logger.error('No se ha podido iniciar el consumidor. Revisa la configuración.', 'CorreoWorker'); process.exitCode = 1; });
