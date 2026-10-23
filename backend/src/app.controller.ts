import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Aplicación')
@Controller()
export class AppController {
  /** Devuelve información básica, sin credenciales ni detalles de infraestructura. */
  @Get()
  @ApiOperation({ summary: 'Información básica de la API' })
  getInfo(): { name: string; version: string; health: string } {
    return { name: 'Backoffice API', version: '0.1.0', health: '/api/health' };
  }
}
