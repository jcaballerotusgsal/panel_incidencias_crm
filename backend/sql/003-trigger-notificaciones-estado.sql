-- Aplicar manualmente DESPUÉS de 002; solo en la copia local autorizada.
-- No reemplaza triggers existentes ni fija/modifica definidores históricos.
-- Un error de la cola revierte también el UPDATE del estado (misma transacción).
DELIMITER $$
CREATE TRIGGER crm_expediente_notificar_estado_au
AFTER UPDATE ON crm_expediente
FOR EACH ROW
BEGIN
  DECLARE evento CHAR(36);
  DECLARE correo VARCHAR(254);
  IF NEW.id_incidencia IS NOT NULL AND NOT (OLD.estado <=> NEW.estado) THEN
    SET evento = UUID();
    SET correo = (SELECT TRIM(dp_email) FROM crm_incidencia WHERE id = NEW.id_incidencia LIMIT 1);
    INSERT INTO crm_notificaciones_correo
      (evento_id, tipo_evento, id_incidencia, id_expediente, estado_anterior, estado_nuevo,
       tipo_destinatario, destinatario, disponible_en, creado_en)
    VALUES
      (evento, 'estado_cambiado', NEW.id_incidencia, NEW.id, OLD.estado, NEW.estado,
       'solicitante', correo, UTC_TIMESTAMP(), UTC_TIMESTAMP()),
      (evento, 'estado_cambiado', NEW.id_incidencia, NEW.id, OLD.estado, NEW.estado,
       'interno', NULL, UTC_TIMESTAMP(), UTC_TIMESTAMP());
  END IF;
END$$
DELIMITER ;
