import { Body, Controller, Header, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CrearQuejaDto } from './crear-queja.dto';
import type { QuejaCreada } from './nueva-queja';
import { QuejasService } from './quejas.service';

@ApiTags('Quejas')
@Controller('quejas')
export class QuejasController {
  /** @param quejas Servicio de alta del formulario web en el CRM local. */
  constructor(private readonly quejas: QuejasService) {}

  /**
   * Crea una incidencia y sus filas relacionadas en el orden autorizado.
   * @param formulario JSON validado por el DTO global, sin estados ni ids impuestos por el cliente.
   * @returns HTTP 201 con el código de incidencia y su estado inicial tras COMMIT.
   * @throws BadRequestException ante entrada, línea o población no válida; ServiceUnavailableException ante fallo del alta.
   */
  @Post()
  @Header('Cache-Control', 'no-store')
  @ApiOperation({ summary: 'Crea una queja con su respuesta y expediente' })
  @ApiResponse({ status: 201, description: 'Alta confirmada; devuelve código de incidencia y estado Pendiente.' })
  @ApiResponse({ status: 400, description: 'Formulario, línea o población no válidos; sin altas parciales.' })
  @ApiResponse({ status: 503, description: 'No se ha podido confirmar el alta.' })
  crear(@Body() formulario: CrearQuejaDto): Promise<QuejaCreada> {
    return this.quejas.crear(formulario);
  }
}
