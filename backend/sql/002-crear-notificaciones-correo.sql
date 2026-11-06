-- Aplicación manual autorizada; MySQL 5.7.21. No ejecutar al arrancar la aplicación.
-- No modifica las tablas originales del CRM ni importa registros.
CREATE TABLE crm_notificaciones_correo (
  id INT NOT NULL AUTO_INCREMENT,
  evento_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  tipo_evento VARCHAR(32) NOT NULL,
  id_incidencia INT NOT NULL,
  id_expediente INT NOT NULL,
  estado_anterior VARCHAR(20) NULL,
  estado_nuevo VARCHAR(20) NULL,
  tipo_destinatario VARCHAR(20) NOT NULL,
  destinatario VARCHAR(254) NULL,
  estado_envio VARCHAR(20) NOT NULL DEFAULT 'pendiente',
  intentos SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  disponible_en DATETIME NOT NULL,
  creado_en DATETIME NOT NULL,
  reservado_hasta DATETIME NULL,
  token CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NULL,
  enviado_en DATETIME NULL,
  ultimo_error VARCHAR(64) NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_notificacion_destinatario (evento_id, tipo_destinatario),
  KEY ix_notificacion_pendiente (estado_envio, disponible_en, id),
  KEY ix_notificacion_reserva (estado_envio, reservado_hasta),
  KEY ix_notificacion_orden (id_incidencia, tipo_destinatario, id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
