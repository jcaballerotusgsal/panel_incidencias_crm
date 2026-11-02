import { Body, Controller, Header, HttpCode, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ConsultarIncidenciaDto } from './consultar-incidencia.dto';
import { Incidencia } from './incidencia';
import { IncidenciasService } from './incidencias.service';

@ApiTags('Incidencias')
@Controller('incidencias')
export class IncidenciasController {
  /** @param incidencias Servicio que comprueba la pareja de datos de consulta. */
  constructor(private readonly incidencias: IncidenciasService) {}

  /**
   * Atiende y registra una consulta sin incluir identificadores en la URL ni cachear la fila.
   * @param consulta Cuerpo JSON validado por ValidationPipe.
   * @returns Las columnas de la incidencia que coincide con ambos datos.
   * @throws NotFoundException si no coincide; ServiceUnavailableException si falla la lectura o su log.
   */
  @Post('consulta')
  @HttpCode(200)
  @Header('Cache-Control', 'no-store')
  @ApiOperation({ summary: 'Consulta una incidencia por id y DNI, correo o código AMB' })
  @ApiResponse({ status: 200, description: 'Incidencia encontrada.' })
  @ApiResponse({ status: 400, description: 'Datos de entrada no válidos.' })
  @ApiResponse({ status: 404, description: 'No se han encontrado los datos.' })
  @ApiResponse({ status: 503, description: 'Consulta temporalmente no disponible.' })
  consultar(@Body() consulta: ConsultarIncidenciaDto): Promise<{ incidencia: Incidencia }> {
    return this.incidencias.consultar(consulta);
  }
}
