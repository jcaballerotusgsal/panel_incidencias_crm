-- Adminer 5.5.1 MySQL 5.7.21 dump

SET NAMES utf8;
SET time_zone = '+00:00';
SET foreign_key_checks = 0;

DROP VIEW IF EXISTS `atlas_vista_actuaciones`;
CREATE TABLE `atlas_vista_actuaciones` (`id_actuacion` int(11), `grupo_clasificacion` int(11), `grupo_desc` varchar(45), `actuacion` varchar(200), `id_incidencia` int(11), `estado` varchar(11), `actuacionc_descp` longtext, `actuacion_fecha` date, `TipoIncidencia` varchar(20), `anyo_recepcion` int(4), `mes_recepcion` int(2), `m_linea` int(11), `nom_linea_tusgsal` varchar(5), `m_vehiculo` varchar(45), `Servei` varchar(6), `Supera` int(1), `Origen` varchar(15));


DROP VIEW IF EXISTS `atlas_vista_incidencias`;
CREATE TABLE `atlas_vista_incidencias` (`id` int(11), `fecha_recepcion` datetime, `anyo_recepcion` int(4), `mes_recepcion` int(2), `via_recepcion` varchar(20), `atendido_por` varchar(45), `dp_sexo` varchar(20), `dp_idioma` varchar(20), `m_tipo` varchar(20), `m_fecha_acontecimiento` date, `m_hora` varchar(40), `m_linea` int(11), `nom_linea_tusgsal` varchar(5), `m_vehiculo` varchar(45), `m_zona` int(11), `poblacion` varchar(45), `m_parada` varchar(80), `m_sentido` varchar(80), `m_detalle` longtext, `incidencia_created_date` datetime, `e_matricula` varchar(10), `e_fecha` date, `tempo_incidencia` int(11), `id_respuesta` int(11), `estado_resp` varchar(20), `fecha_resp` date, `medio_resp` varchar(20), `tiempo_resp` int(11), `estado_inc_int_resp` varchar(20), `Servei` varchar(6), `Supera` int(1), `Origen` varchar(15));


DROP TABLE IF EXISTS `crm_actuacion`;
CREATE TABLE `crm_actuacion` (
  `id_actuacion` int(11) NOT NULL AUTO_INCREMENT,
  `grupo_clasificacion` int(11) NOT NULL,
  `actuacion` varchar(200) COLLATE utf8_spanish_ci DEFAULT NULL,
  `estado` varchar(11) COLLATE utf8_spanish_ci DEFAULT NULL,
  `actuacionc_descp` longtext COLLATE utf8_spanish_ci,
  `id_incidencia` int(11) DEFAULT NULL,
  `actuacion_fecha` date DEFAULT NULL,
  `actuacion_created_date` datetime DEFAULT CURRENT_TIMESTAMP,
  `actuacion_date_updated` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_actuacion`),
  KEY `id_incidencia` (`id_incidencia`),
  CONSTRAINT `crm_actuacion_ibfk_1` FOREIGN KEY (`id_incidencia`) REFERENCES `crm_incidencia` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_spanish_ci;


DROP TABLE IF EXISTS `crm_actuacion_images`;
CREATE TABLE `crm_actuacion_images` (
  `id_actuacion_image` int(11) NOT NULL AUTO_INCREMENT,
  `id_actuacion` int(11) NOT NULL,
  `image_name` varchar(100) COLLATE utf8_spanish_ci DEFAULT NULL,
  PRIMARY KEY (`id_actuacion_image`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_spanish_ci;


DROP TABLE IF EXISTS `crm_area`;
CREATE TABLE `crm_area` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `area_name` varchar(40) COLLATE utf8_spanish_ci NOT NULL,
  `area_description` longtext COLLATE utf8_spanish_ci NOT NULL,
  `created_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_spanish_ci;


DROP TABLE IF EXISTS `crm_area_map`;
CREATE TABLE `crm_area_map` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `area_id` int(11) NOT NULL,
  `group_id` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `area_id` (`area_id`),
  KEY `group_id` (`group_id`),
  CONSTRAINT `crm_area_map_ibfk_1` FOREIGN KEY (`area_id`) REFERENCES `crm_area` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_spanish_ci;


DROP TABLE IF EXISTS `crm_conductor`;
CREATE TABLE `crm_conductor` (
  `matricula` smallint(6) NOT NULL,
  `nombre` varchar(40) NOT NULL,
  `activo` tinyint(1) DEFAULT '1'
) ENGINE=InnoDB DEFAULT CHARSET=utf8;


DROP TABLE IF EXISTS `crm_expediente`;
CREATE TABLE `crm_expediente` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `id_incidencia` int(11) DEFAULT NULL,
  `id_resolucion` int(11) DEFAULT NULL,
  `estado` varchar(20) COLLATE utf8_spanish_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `id_incidencia` (`id_incidencia`),
  KEY `id_resolucion` (`id_resolucion`),
  CONSTRAINT `crm_expediente_ibfk_1` FOREIGN KEY (`id_incidencia`) REFERENCES `crm_incidencia` (`id`),
  CONSTRAINT `crm_expediente_ibfk_2` FOREIGN KEY (`id_resolucion`) REFERENCES `crm_respuesta` (`id_respuesta`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_spanish_ci;


DROP TABLE IF EXISTS `crm_grupo`;
CREATE TABLE `crm_grupo` (
  `id_grupo` int(11) NOT NULL AUTO_INCREMENT,
  `grupo_desc` varchar(45) COLLATE utf8_spanish_ci NOT NULL,
  PRIMARY KEY (`id_grupo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_spanish_ci;


DROP TABLE IF EXISTS `crm_grupo_descripcion`;
CREATE TABLE `crm_grupo_descripcion` (
  `id_desc` int(11) NOT NULL AUTO_INCREMENT,
  `descripcion` varchar(60) COLLATE utf8_spanish_ci NOT NULL,
  `id_grupo` int(11) NOT NULL,
  `id_tipus` int(11) DEFAULT NULL,
  `id_subtipus` int(11) DEFAULT NULL,
  `extra` json DEFAULT NULL,
  PRIMARY KEY (`id_desc`),
  KEY `id_grupo_idx` (`id_grupo`),
  CONSTRAINT `id_grupo` FOREIGN KEY (`id_grupo`) REFERENCES `crm_grupo` (`id_grupo`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_spanish_ci;


DROP TABLE IF EXISTS `crm_incidencia`;
CREATE TABLE `crm_incidencia` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `fecha_recepcion` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `via_recepcion` varchar(20) COLLATE utf8_spanish_ci NOT NULL,
  `atendido_por` varchar(45) COLLATE utf8_spanish_ci DEFAULT NULL,
  `dp_nombre` varchar(45) COLLATE utf8_spanish_ci DEFAULT NULL,
  `dp_apellidos` varchar(45) COLLATE utf8_spanish_ci DEFAULT NULL,
  `dp_dni` varchar(10) CHARACTER SET utf8 DEFAULT NULL,
  `dp_sexo` varchar(20) COLLATE utf8_spanish_ci DEFAULT NULL,
  `dp_idioma` varchar(20) COLLATE utf8_spanish_ci DEFAULT NULL,
  `dp_telefono` varchar(45) COLLATE utf8_spanish_ci DEFAULT NULL,
  `dp_email` varchar(45) COLLATE utf8_spanish_ci DEFAULT NULL,
  `dp_correoPostal` longtext COLLATE utf8_spanish_ci,
  `m_tipo` varchar(20) COLLATE utf8_spanish_ci DEFAULT NULL,
  `m_fechaAcontecimiento_date` date DEFAULT NULL,
  `m_hora` varchar(40) COLLATE utf8_spanish_ci DEFAULT NULL,
  `m_linea` int(11) DEFAULT NULL,
  `m_vehiculo` varchar(45) COLLATE utf8_spanish_ci DEFAULT NULL,
  `m_zona` int(11) DEFAULT NULL,
  `m_parada` varchar(80) COLLATE utf8_spanish_ci DEFAULT NULL,
  `m_sentido` varchar(80) COLLATE utf8_spanish_ci DEFAULT NULL,
  `m_detalle` longtext COLLATE utf8_spanish_ci,
  `nombre_corto` longtext COLLATE utf8_spanish_ci,
  `incidencia_created_date` datetime DEFAULT CURRENT_TIMESTAMP,
  `incidencia_date_updated` datetime DEFAULT CURRENT_TIMESTAMP,
  `e_matricula` varchar(10) COLLATE utf8_spanish_ci DEFAULT NULL,
  `e_conductor` varchar(60) COLLATE utf8_spanish_ci DEFAULT NULL,
  `e_fecha` date DEFAULT NULL,
  `e_tempo` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `m_zona_fk_idx` (`m_zona`),
  CONSTRAINT `m_zona` FOREIGN KEY (`m_zona`) REFERENCES `crm_m_zona_poblaciones` (`id_m_zona`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_spanish_ci;


DROP TABLE IF EXISTS `crm_incidencia_images`;
CREATE TABLE `crm_incidencia_images` (
  `id_respuesta_image` int(11) NOT NULL AUTO_INCREMENT,
  `id_respuesta` int(11) NOT NULL,
  `image_name` varchar(1000) COLLATE utf8_spanish_ci DEFAULT NULL,
  PRIMARY KEY (`id_respuesta_image`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_spanish_ci;


DROP TABLE IF EXISTS `crm_lineas_tusgsal_amb`;
CREATE TABLE `crm_lineas_tusgsal_amb` (
  `id_linea_amb` int(11) NOT NULL,
  `nom_linea_tusgsal` varchar(5) DEFAULT NULL,
  PRIMARY KEY (`id_linea_amb`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='	';


DROP TABLE IF EXISTS `crm_missatges_subtipus`;
CREATE TABLE `crm_missatges_subtipus` (
  `id_tipus` tinyint(3) unsigned NOT NULL,
  `tipus_missatge` varchar(64) COLLATE utf8_spanish_ci NOT NULL,
  `id_subtipus` smallint(5) unsigned NOT NULL,
  `subtipus_missatge` varchar(128) COLLATE utf8_spanish_ci NOT NULL,
  PRIMARY KEY (`id_subtipus`),
  KEY `idx_tipus` (`id_tipus`,`tipus_missatge`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_spanish_ci;


DROP TABLE IF EXISTS `crm_m_zona_poblaciones`;
CREATE TABLE `crm_m_zona_poblaciones` (
  `id_m_zona` int(11) NOT NULL,
  `poblacion` varchar(45) DEFAULT NULL,
  PRIMARY KEY (`id_m_zona`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;


DROP TABLE IF EXISTS `crm_respuesta`;
CREATE TABLE `crm_respuesta` (
  `id_respuesta` int(11) NOT NULL AUTO_INCREMENT,
  `id_incidencia` int(11) NOT NULL,
  `estado` varchar(20) COLLATE utf8_spanish_ci NOT NULL DEFAULT 'Pendiente',
  `fecha` date DEFAULT NULL,
  `medio` varchar(20) COLLATE utf8_spanish_ci DEFAULT NULL,
  `tiempo` int(11) DEFAULT NULL,
  `respuesta` longtext COLLATE utf8_spanish_ci,
  `estado2` varchar(20) COLLATE utf8_spanish_ci NOT NULL DEFAULT 'Abierta',
  `observaciones` longtext COLLATE utf8_spanish_ci,
  `respuesta_created_date` datetime DEFAULT CURRENT_TIMESTAMP,
  `respuesta_date_updated` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_respuesta`),
  KEY `id_respuesta` (`id_incidencia`),
  CONSTRAINT `crm_respuesta_ibfk_1` FOREIGN KEY (`id_incidencia`) REFERENCES `crm_incidencia` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_spanish_ci;


DROP TABLE IF EXISTS `crm_respuesta_conductor`;
CREATE TABLE `crm_respuesta_conductor` (
  `id_respuesta_conductor` int(11) NOT NULL AUTO_INCREMENT,
  `id_crm_incidencia` int(11) NOT NULL,
  `fecha_acontecimiento` date DEFAULT NULL,
  `dni_conductor` varchar(10) COLLATE utf8_spanish_ci NOT NULL,
  `fecha_sms` date DEFAULT NULL,
  `fecha_respuesta` date DEFAULT NULL,
  `observaciones` longtext COLLATE utf8_spanish_ci,
  `visibleApp` tinyint(4) DEFAULT '1',
  PRIMARY KEY (`id_respuesta_conductor`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_spanish_ci;


DROP TABLE IF EXISTS `crm_respuesta_images`;
CREATE TABLE `crm_respuesta_images` (
  `id_respuesta_image` int(11) NOT NULL AUTO_INCREMENT,
  `id_respuesta` int(11) NOT NULL,
  `image_name` varchar(1000) COLLATE utf8_spanish_ci DEFAULT NULL,
  PRIMARY KEY (`id_respuesta_image`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_spanish_ci;


DROP TABLE IF EXISTS `crm_roles`;
CREATE TABLE `crm_roles` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `role` varchar(50) COLLATE utf8_spanish_ci NOT NULL,
  `description` longtext COLLATE utf8_spanish_ci NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_spanish_ci;


DROP TABLE IF EXISTS `crm_users`;
CREATE TABLE `crm_users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(20) COLLATE utf8_spanish_ci NOT NULL,
  `email` varchar(30) COLLATE utf8_spanish_ci NOT NULL,
  `password` varchar(80) COLLATE utf8_spanish_ci NOT NULL,
  `user_created_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `user_date_updated` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `role_id` int(11) DEFAULT NULL,
  `via_reception` varchar(50) COLLATE utf8_spanish_ci DEFAULT NULL,
  `fullname` varchar(50) COLLATE utf8_spanish_ci NOT NULL,
  `area_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `role_id` (`role_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_spanish_ci;


DROP TABLE IF EXISTS `atlas_vista_actuaciones`;
CREATE ALGORITHM=UNDEFINED DEFINER=`atlas`@`%` SQL SECURITY DEFINER VIEW `atlas_vista_actuaciones` AS select `act`.`id_actuacion` AS `id_actuacion`,`act`.`grupo_clasificacion` AS `grupo_clasificacion`,ifnull(`grp`.`grupo_desc`,'-desconocido-') AS `grupo_desc`,`act`.`actuacion` AS `actuacion`,`act`.`id_incidencia` AS `id_incidencia`,`act`.`estado` AS `estado`,`act`.`actuacionc_descp` AS `actuacionc_descp`,`act`.`actuacion_fecha` AS `actuacion_fecha`,`inc`.`m_tipo` AS `TipoIncidencia`,`inc`.`anyo_recepcion` AS `anyo_recepcion`,`inc`.`mes_recepcion` AS `mes_recepcion`,`inc`.`m_linea` AS `m_linea`,`inc`.`nom_linea_tusgsal` AS `nom_linea_tusgsal`,`inc`.`m_vehiculo` AS `m_vehiculo`,`inc`.`Servei` AS `Servei`,`inc`.`Supera` AS `Supera`,`inc`.`Origen` AS `Origen` from ((`crm_actuacion` `act` left join `crm_grupo` `grp` on((`act`.`grupo_clasificacion` = `grp`.`id_grupo`))) left join `atlas_vista_incidencias` `inc` on((`act`.`id_incidencia` = `inc`.`id`)));

DROP TABLE IF EXISTS `atlas_vista_incidencias`;
CREATE ALGORITHM=UNDEFINED DEFINER=`atlas`@`%` SQL SECURITY DEFINER VIEW `atlas_vista_incidencias` AS select `incid`.`id` AS `id`,`incid`.`fecha_recepcion` AS `fecha_recepcion`,year(`incid`.`fecha_recepcion`) AS `anyo_recepcion`,month(`incid`.`fecha_recepcion`) AS `mes_recepcion`,`incid`.`via_recepcion` AS `via_recepcion`,`incid`.`atendido_por` AS `atendido_por`,`incid`.`dp_sexo` AS `dp_sexo`,`incid`.`dp_idioma` AS `dp_idioma`,`incid`.`m_tipo` AS `m_tipo`,`incid`.`m_fechaAcontecimiento_date` AS `m_fecha_acontecimiento`,`incid`.`m_hora` AS `m_hora`,`incid`.`m_linea` AS `m_linea`,ifnull(`lin`.`nom_linea_tusgsal`,'--') AS `nom_linea_tusgsal`,`incid`.`m_vehiculo` AS `m_vehiculo`,`incid`.`m_zona` AS `m_zona`,`pob`.`poblacion` AS `poblacion`,`incid`.`m_parada` AS `m_parada`,`incid`.`m_sentido` AS `m_sentido`,`incid`.`m_detalle` AS `m_detalle`,`incid`.`incidencia_created_date` AS `incidencia_created_date`,`incid`.`e_matricula` AS `e_matricula`,`incid`.`e_fecha` AS `e_fecha`,`incid`.`e_tempo` AS `tempo_incidencia`,`resp`.`id_respuesta` AS `id_respuesta`,`resp`.`estado` AS `estado_resp`,`resp`.`fecha` AS `fecha_resp`,`resp`.`medio` AS `medio_resp`,`resp`.`tiempo` AS `tiempo_resp`,`resp`.`estado2` AS `estado_inc_int_resp`,(case when (left(ifnull(`lin`.`nom_linea_tusgsal`,'--'),1) = 'N') then 'Nitbus' else 'Diurn' end) AS `Servei`,(case when (`resp`.`tiempo` > 10) then 1 else 0 end) AS `Supera`,(case when (`incid`.`via_recepcion` = 'AMB') then 'AMB' else 'Interes Empresa' end) AS `Origen` from (((`crm_incidencia` `incid` left join `crm_respuesta` `resp` on((`incid`.`id` = `resp`.`id_incidencia`))) left join `crm_lineas_tusgsal_amb` `lin` on((`incid`.`m_linea` = `lin`.`id_linea_amb`))) left join `crm_m_zona_poblaciones` `pob` on((`incid`.`m_zona` = `pob`.`id_m_zona`)));

-- 2026-10-22 11:48:28 UTC