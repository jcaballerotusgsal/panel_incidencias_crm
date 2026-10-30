/** Datos ya validados y preparados por el servicio para las columnas existentes del CRM. */
export interface NuevaQueja {
  nombre: string;
  apellidos: string;
  dni?: string | null;
  telefono?: string | null;
  correo: string;
  direccionPostal: string | null;
  fecha: string;
  hora: string;
  linea: number;
  numeroVehiculo?: string | null;
  parada?: string | null;
  sentido?: string | null;
  detalle: string | null;
}

/** Confirmación mínima del alta, sin datos personales ni ids internos de respuesta o expediente. */
export interface QuejaCreada {
  codigoIncidencia: number;
  estado: 'Pendiente';
}
