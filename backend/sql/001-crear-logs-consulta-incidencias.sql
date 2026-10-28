-- Creación manual autorizada para la copia local del CRM, MySQL 5.7.21.
-- Ejecutar con la base local seleccionada; no se aplica al arrancar la aplicación.
-- Sin IF NOT EXISTS: si el nombre ya existe, detenerse y revisar su estructura.
CREATE TABLE `crm_logs_consulta_incidencias` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `FechaHoraPeticion` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `CodIncidencia` VARCHAR(255) NOT NULL,
  `Identificador` VARCHAR(255) NOT NULL,
  `Valida` BOOLEAN NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_spanish_ci;
