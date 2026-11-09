import { Injectable } from '@nestjs/common';
import { createTransport, type Transporter } from 'nodemailer';
import { isEmail } from 'class-validator';
import type { Notificacion } from './notificacion';
import { NotificacionesConfig } from './notificaciones.config';
import { crearHtmlCorreoUsuario, ErrorPlantillaCorreo } from './plantilla-correo';

/** Error de envío con código público; no conserva respuestas externas ni destinatarios. */
export class ErrorEnvio extends Error {
  /** @param code Código público. @param permanent Si requiere intervención. @param retryAfter Espera mínima del proveedor, en segundos. */
  constructor(readonly code: string, readonly permanent = false, readonly retryAfter = 0) { super(code); }
}

/** Envía un único destinatario por llamada mediante Microsoft Graph o SMTP. */
@Injectable()
export class CorreoService {
  private readonly smtp: Transporter | null;
  private accessToken = '';
  private expiresAt = 0;

  /**
   * Prepara el transporte del proceso emisor, sin establecer conexiones todavía.
   * @param config Configuración del servidor; la API productora no crea este servicio.
   * @throws Error seguro si el envío está activado con configuración incompleta.
   */
  constructor(private readonly config: NotificacionesConfig) {
    config.validarEnvio();
    this.smtp = config.enabled && config.transport === 'smtp' ? createTransport({
      host: config.host, port: config.port, secure: config.secure, requireTLS: config.requireTls,
      auth: config.user ? { user: config.user, pass: config.password } : undefined,
      connectionTimeout: 10000, greetingTimeout: 10000, socketTimeout: 15000, dnsTimeout: 5000,
      logger: false, debug: false,
    }) : null;
  }

  /**
   * Entrega un aviso al proveedor; el solicitante usa la plantilla HTML y el interno conserva texto.
   * @param aviso Fila reservada; el correo interno ya está resuelto y persistido.
   * @returns Promesa cuando el proveedor acepta el envío; no confirma llegada al buzón.
   * @throws ErrorEnvio con código seguro; una plantilla inválida se puede corregir antes del reintento.
   */
  async enviar(aviso: Notificacion): Promise<void> {
    if (!this.config.enabled) throw new ErrorEnvio('ENVIO_DESACTIVADO');
    if (!aviso.destinatario || !isEmail(aviso.destinatario) || !Number.isSafeInteger(aviso.id_incidencia)
      || aviso.id_incidencia < 1 || !['queja_creada', 'estado_cambiado'].includes(aviso.tipo_evento)
      || !['solicitante', 'interno'].includes(aviso.tipo_destinatario) || !/^[0-9a-f-]{36}$/i.test(aviso.evento_id)) {
      throw new ErrorEnvio('AVISO_INVALIDO', true);
    }
    const codigo = String(aviso.id_incidencia);
    const subject = aviso.tipo_evento === 'queja_creada' ? `Queja ${codigo}: recibida` : `Queja ${codigo}: cambio de estado`;
    const text = [
      aviso.tipo_destinatario === 'interno' ? `Aviso de gestión de la queja ${codigo}.` : `Información sobre tu queja ${codigo}.`,
      aviso.tipo_evento === 'queja_creada' ? 'La queja se ha registrado correctamente.' : `Estado anterior: ${aviso.estado_anterior ?? 'No informado'}.`,
      `Estado actual: ${aviso.estado_nuevo ?? 'No informado'}.`,
      ...(this.config.consultationUrl ? [`Puedes consultar la incidencia en ${this.config.consultationUrl}`] : []),
    ].join('\n\n');
    try {
      const html = aviso.tipo_destinatario === 'solicitante'
        ? await crearHtmlCorreoUsuario(aviso, this.config.consultationUrl) : undefined;
      if (this.config.transport === 'microsoft365') {
        await this.enviarGraph(aviso.destinatario, subject, text, aviso.evento_id, aviso.tipo_destinatario, html);
      } else {
        if (!this.smtp) throw new ErrorEnvio('SMTP_NO_CONFIGURADO', true);
        await this.smtp.sendMail({ from: this.config.from, to: aviso.destinatario, subject, text, ...(html ? { html } : {}),
          messageId: `<${aviso.evento_id}.${aviso.tipo_destinatario}@${this.config.from.split('@')[1]}>`,
          disableFileAccess: true, disableUrlAccess: true });
      }
    } catch (error: unknown) {
      if (error instanceof ErrorPlantillaCorreo) throw new ErrorEnvio('PLANTILLA_CORREO_INVALIDA');
      if (error instanceof ErrorEnvio) throw error;
      const code = typeof error === 'object' && error !== null && 'responseCode' in error ? error.responseCode : null;
      throw new ErrorEnvio('PROVEEDOR_CORREO', typeof code === 'number' && code >= 500);
    }
  }

  /**
   * Obtiene un token de Entra o reutiliza su copia temporal en memoria.
   * @returns Token con margen de expiración; no se guarda en disco ni se registra.
   * @throws ErrorEnvio ante rechazo o contrato inválido; los fallos de red los sanea enviar.
   */
  private async token(): Promise<string> {
    if (this.accessToken && Date.now() < this.expiresAt) return this.accessToken;
    const response = await fetch(`https://login.microsoftonline.com/${this.config.tenantId}/oauth2/v2.0/token`, {
      method: 'POST', redirect: 'error', signal: AbortSignal.timeout(10000),
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ client_id: this.config.clientId, client_secret: this.config.clientSecret,
        scope: 'https://graph.microsoft.com/.default', grant_type: 'client_credentials' }),
    });
    if (!response.ok) throw new ErrorEnvio('MS365_AUTENTICACION', response.status >= 400 && response.status < 500 && ![408, 429].includes(response.status), retryAfter(response));
    const payload: unknown = await response.json();
    if (typeof payload !== 'object' || payload === null || !('access_token' in payload) || typeof payload.access_token !== 'string'
      || !payload.access_token || !('expires_in' in payload) || typeof payload.expires_in !== 'number'
      || !Number.isFinite(payload.expires_in) || payload.expires_in <= 0) throw new ErrorEnvio('MS365_RESPUESTA_INVALIDA');
    this.accessToken = payload.access_token;
    this.expiresAt = Date.now() + Math.max(0, payload.expires_in - 60) * 1000;
    return this.accessToken;
  }

  /**
   * Presenta HTML al solicitante o texto al destinatario interno mediante Graph.
   * @param to Correo validado. @param subject Asunto. @param text Cuerpo sin datos de reclamación.
   * @param eventId UUID estable. @param tipo Tipo de destinatario para trazabilidad.
   * @param html Plantilla ya renderizada; si se omite, el cuerpo utiliza texto plano.
   * @returns Promesa al recibir 202, que confirma aceptación, no entrega.
   * @throws ErrorEnvio clasificado por estado HTTP; invalida el token ante 401.
   */
  private async enviarGraph(to: string, subject: string, text: string, eventId: string, tipo: string, html?: string): Promise<void> {
    const token = await this.token();
    const response = await fetch(`https://graph.microsoft.com/v1.0/users/${encodeURIComponent(this.config.from)}/sendMail`, {
      method: 'POST', redirect: 'error', signal: AbortSignal.timeout(15000),
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: { subject, body: { contentType: html === undefined ? 'Text' : 'html', content: html ?? text },
        toRecipients: [{ emailAddress: { address: to } }],
        internetMessageHeaders: [{ name: 'x-crm-notificacion', value: `${eventId}.${tipo}` }] }, saveToSentItems: true }),
    });
    if (response.status === 202) return;
    if (response.status === 401) { this.accessToken = ''; this.expiresAt = 0; }
    throw new ErrorEnvio('MS365_ENVIO', response.status >= 400 && response.status < 500 && ![401, 408, 429].includes(response.status), retryAfter(response));
  }

  /** Libera el transporte SMTP cuando termina el proceso. */
  cerrar(): void { this.smtp?.close(); }
}

/**
 * Interpreta Retry-After sin conservar el resto de la respuesta del proveedor.
 * @param response Respuesta HTTP. @returns Espera en segundos, de cero a un día.
 */
function retryAfter(response: Response): number {
  const value = response.headers.get('retry-after');
  if (!value) return 0;
  const seconds = /^\d+$/.test(value) ? Number(value) : Math.ceil((Date.parse(value) - Date.now()) / 1000);
  return Number.isFinite(seconds) ? Math.max(0, Math.min(86400, seconds)) : 0;
}
