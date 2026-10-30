import { Injectable } from '@nestjs/common';
import { CrearQuejaDto } from './crear-queja.dto';
import type { NuevaQueja, QuejaCreada } from './nueva-queja';
import { QuejasRepository } from './quejas.repository';
import { fechaHoraRecepcion } from './validaciones';

/** Prepara los campos del formulario y devuelve el código solo cuando se confirma el alta. */
@Injectable()
export class QuejasService {
  /** @param repository Escritura transaccional de incidencia, respuesta y expediente. */
  constructor(private readonly repository: QuejasRepository) {}

  /**
   * Recibe una queja validada y fija los datos de recepción desde el reloj del servidor.
   * @param formulario Entrada del DTO; lugar se acepta pero no se guarda por petición del usuario.
   * @returns Código generado y estado inicial sin devolver datos personales.
   * @throws BadRequestException si la línea ya no existe; ServiceUnavailableException si falla el alta.
   */
  async crear(formulario: CrearQuejaDto): Promise<QuejaCreada> {
    const momento = fechaHoraRecepcion(new Date());
    const direccionPostal = [formulario.direccion, formulario.codigoPostal ? `Cp: ${formulario.codigoPostal}` : null]
      .filter(Boolean).join(' ') || null;
    const datos: NuevaQueja = {
      nombre: formulario.nombre, apellidos: formulario.apellidos,
      dni: formulario.dni, telefono: formulario.telefono, correo: formulario.correo,
      direccionPostal, fecha: formulario.fecha, hora: formulario.hora, linea: formulario.linea,
      numeroVehiculo: formulario.numeroVehiculo, parada: formulario.parada, sentido: formulario.sentido,
      detalle: formulario.motivo || null,
    };
    const codigoIncidencia = await this.repository.crear(datos, momento);
    return { codigoIncidencia, estado: 'Pendiente' };
  }
}
