/** Incidencia, nombre de línea y estados de sus expedientes; conserva fechas y nulos del CRM. */
export interface Incidencia {
  id: number;
  fecha_recepcion: string;
  via_recepcion: string;
  atendido_por: string | null;
  dp_nombre: string | null;
  dp_apellidos: string | null;
  dp_dni: string | null;
  dp_sexo: string | null;
  dp_idioma: string | null;
  dp_telefono: string | null;
  dp_email: string | null;
  dp_correoPostal: string | null;
  m_tipo: string | null;
  m_fechaAcontecimiento_date: string | null;
  m_hora: string | null;
  m_linea: number | null;
  nom_linea_tusgsal: string | null;
  estados_expedientes: (string | null)[];
  m_vehiculo: string | null;
  m_zona: number | null;
  m_parada: string | null;
  m_sentido: string | null;
  m_detalle: string | null;
  nombre_corto: string | null;
  incidencia_created_date: string | null;
  incidencia_date_updated: string | null;
  e_matricula: string | null;
  e_conductor: string | null;
  e_fecha: string | null;
  e_tempo: number | null;
}
