import { Injectable } from '@nestjs/common';
import { isEmail } from 'class-validator';

/** Lee únicamente la configuración del servidor; los errores nunca incluyen sus valores. */
@Injectable()
export class NotificacionesConfig {
  readonly enabled: boolean;
  readonly internalTo: string;
  readonly from: string;
  readonly transport: 'microsoft365' | 'smtp';
  readonly tenantId: string;
  readonly clientId: string;
  readonly clientSecret: string;
  readonly host: string;
  readonly port: number;
  readonly secure: boolean;
  readonly requireTls: boolean;
  readonly user: string;
  readonly password: string;
  readonly intervalMs: number;
  readonly maxAttempts: number;
  readonly consultationUrl: string;

  /**
   * Lee variables del servidor sin activar el envío; no consulta MySQL ni Microsoft 365.
   * @throws Error ante banderas, intervalos, transporte o URL inválidos, sin revelar valores.
   */
  constructor() {
    this.enabled = booleanValue('NOTIFICATIONS_ENABLED', false);
    this.internalTo = process.env.NOTIFICATIONS_INTERNAL_TO?.trim() ?? '';
    this.from = process.env.MAIL_FROM?.trim() ?? '';
    const transport = process.env.MAIL_TRANSPORT ?? 'microsoft365';
    if (transport !== 'microsoft365' && transport !== 'smtp') throw new Error('MAIL_TRANSPORT debe ser microsoft365 o smtp.');
    this.transport = transport;
    this.tenantId = process.env.MS365_TENANT_ID?.trim() ?? '';
    this.clientId = process.env.MS365_CLIENT_ID?.trim() ?? '';
    this.clientSecret = process.env.MS365_CLIENT_SECRET ?? '';
    this.host = process.env.SMTP_HOST?.trim() ?? '';
    this.port = integerValue('SMTP_PORT', 587, 1, 65535);
    this.secure = booleanValue('SMTP_SECURE', false);
    this.requireTls = booleanValue('SMTP_REQUIRE_TLS', true);
    this.user = process.env.SMTP_USER ?? '';
    this.password = process.env.SMTP_PASSWORD ?? '';
    this.intervalMs = integerValue('NOTIFICATIONS_INTERVAL_MS', 5000, 100, 60000);
    this.maxAttempts = integerValue('NOTIFICATIONS_MAX_ATTEMPTS', 5, 1, 10);
    this.consultationUrl = process.env.NOTIFICATIONS_CONSULTATION_URL?.trim() ?? '';
    if (this.consultationUrl) {
      try {
        const url = new URL(this.consultationUrl);
        if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash) throw new Error();
      } catch { throw new Error('NOTIFICATIONS_CONSULTATION_URL debe ser una URL HTTP(S) sin credenciales ni parámetros.'); }
    }
  }

  /**
   * Comprueba credenciales y direcciones únicamente cuando el envío está activado.
   * @throws Error seguro si falta la configuración necesaria; no intenta autenticarse.
   */
  validarEnvio(): void {
    if (!this.enabled) return;
    if (!isEmail(this.from) || !isEmail(this.internalTo)) throw new Error('Configura MAIL_FROM y NOTIFICATIONS_INTERNAL_TO con direcciones válidas.');
    if (this.transport === 'microsoft365') {
      const guid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!guid.test(this.tenantId) || !guid.test(this.clientId) || !this.clientSecret) {
        throw new Error('Configura MS365_TENANT_ID, MS365_CLIENT_ID y MS365_CLIENT_SECRET antes de activar Microsoft 365.');
      }
    } else if (!this.host || Boolean(this.user) !== Boolean(this.password)) {
      throw new Error('Configura SMTP_HOST y la autenticación SMTP antes de activar el envío.');
    }
  }
}

/**
 * Lee una bandera estricta sin imprimir su valor.
 * @param name Variable del servidor. @param fallback Valor si está ausente o vacía.
 * @returns Booleano interpretado. @throws Error ante valores distintos de true/false.
 */
function booleanValue(name: string, fallback: boolean): boolean {
  const value = process.env[name];
  if (value === undefined || value === '') return fallback;
  if (value !== 'true' && value !== 'false') throw new Error(`La variable ${name} debe ser true o false.`);
  return value === 'true';
}

/**
 * Comprueba un entero de configuración sin revelar su contenido en errores.
 * @param name Variable. @param fallback Valor ausente. @param min Mínimo. @param max Máximo.
 * @returns Entero validado. @throws Error si el formato o el rango son inválidos.
 */
function integerValue(name: string, fallback: number, min: number, max: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw === '') return fallback;
  const value = Number(raw);
  if (!/^\d+$/.test(raw) || !Number.isInteger(value) || value < min || value > max) throw new Error(`La variable ${name} no está en su intervalo permitido.`);
  return value;
}
