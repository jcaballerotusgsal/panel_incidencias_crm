/** Aviso persistente independiente por destinatario; las fechas de esta cola usan UTC. */
export interface Notificacion {
  id: number;
  evento_id: string;
  tipo_evento: 'queja_creada' | 'estado_cambiado';
  id_incidencia: number;
  /** Referencia del alta web; NULL cuando el evento procede de una respuesta del CRM. */
  id_expediente: number | null;
  estado_anterior: string | null;
  estado_nuevo: string | null;
  tipo_destinatario: 'solicitante' | 'interno';
  destinatario: string | null;
  intentos: number;
  token: string;
}
