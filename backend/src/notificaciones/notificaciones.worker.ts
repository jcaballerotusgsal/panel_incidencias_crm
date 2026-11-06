import { Injectable, Logger } from '@nestjs/common';
import { CorreoService, ErrorEnvio } from './correo.service';
import { NotificacionesConfig } from './notificaciones.config';
import { NotificacionesRepository } from './notificaciones.repository';

/** Proceso independiente del servidor HTTP, con un único lote activo y errores sin datos personales. */
@Injectable()
export class NotificacionesWorker {
  private readonly logger = new Logger(NotificacionesWorker.name);
  private running = false;
  private stopping = false;

  /** @param repository Cola persistente. @param correo Proveedor de correo. @param config Activación del envío. */
  constructor(private readonly repository: NotificacionesRepository, private readonly correo: CorreoService, private readonly config: NotificacionesConfig) {}

  /**
   * Procesa hasta diez avisos sin solapar lotes; aísla fallos del proveedor por destinatario.
   * @returns Número procesado, o cero si está desactivado, ocupado o deteniéndose.
   * @throws Error de persistencia si no puede reservar o guardar un resultado; no expone datos externos.
   */
  async procesarLote(): Promise<number> {
    if (!this.config.enabled || this.running || this.stopping) return 0;
    this.running = true;
    let processed = 0;
    try {
      while (processed < 10 && !this.stopping) {
        const aviso = await this.repository.reservar();
        if (!aviso) break;
        try { await this.correo.enviar(aviso); } catch (error: unknown) {
          const failure = error instanceof ErrorEnvio ? error : new ErrorEnvio('ENVIO_TEMPORAL');
          await this.repository.rechazar(aviso, failure.code, failure.permanent, failure.retryAfter);
          this.logger.warn(`Aviso ${aviso.id}: ${failure.code}`);
          processed++;
          continue;
        }
        // Un fallo al guardar la aceptación conserva la reserva: no se confunde con rechazo del proveedor.
        await this.repository.confirmar(aviso);
        processed++;
      }
      return processed;
    } finally { this.running = false; }
  }

  /** Impide adquirir nuevas reservas al recibir la señal de apagado. */
  detener(): void { this.stopping = true; }
}
