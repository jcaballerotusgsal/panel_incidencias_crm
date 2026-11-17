-- Aplicación MANUAL, previa revisión del esquema y copia de seguridad.
-- Solo para colas existentes creadas con id_expediente NOT NULL.
-- No modifica registros ni tablas originales del CRM.
-- MySQL confirma el DDL implícitamente; no es una migración automática.
ALTER TABLE crm_notificaciones_correo
  MODIFY COLUMN id_expediente INT NULL;
