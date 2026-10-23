import { Injectable } from '@nestjs/common';

/** Contrato de liveness; no certifica conectividad con una base de datos. */
export interface HealthStatus {
  status: 'ok';
  service: 'backoffice-api';
  timestamp: string;
  uptimeSeconds: number;
  database: 'not-configured';
}

@Injectable()
export class HealthService {
  /** Devuelve el estado del proceso y la hora UTC de esta comprobación. */
  getStatus(): HealthStatus {
    return {
      status: 'ok',
      service: 'backoffice-api',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      database: 'not-configured',
    };
  }
}
