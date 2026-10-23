import { Controller, Get, Header } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { HealthService, HealthStatus } from './health.service';

@ApiTags('Salud')
@Controller('health')
export class HealthController {
  /** Inyecta el servicio que calcula el estado del proceso. */
  constructor(private readonly healthService: HealthService) {}

  /** Atiende GET /api/health sin cachear una comprobación anterior. */
  @Get()
  @Header('Cache-Control', 'no-store')
  @ApiOperation({ summary: 'Comprueba que la API está respondiendo' })
  getHealth(): HealthStatus {
    return this.healthService.getStatus();
  }
}
