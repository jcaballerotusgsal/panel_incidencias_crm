-- Tabla web tusgsal contacto usuarios:
CREATE TABLE `jos_chronoforms_data_contacte1` (
  `cf_id` int(11) NOT NULL AUTO_INCREMENT,
  `cf_created` datetime NOT NULL,
  `cf_ipaddress` varchar(255) NOT NULL,
  `nom` varchar(255) NOT NULL,
  `cognoms` varchar(255) NOT NULL,
  `adreca` varchar(255) NOT NULL,
  `codi_postal` varchar(255) NOT NULL,
  `telefon` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `dni` varchar(255) NOT NULL,
  `data1` varchar(255) NOT NULL,
  `hora` varchar(255) NOT NULL,
  `linia` varchar(255) NOT NULL,
  `num_vehicle` int(11) NOT NULL,
  `lloc` varchar(255) NOT NULL,
  `parada` varchar(255) NOT NULL,
  `sentit` varchar(255) NOT NULL,
  `motiu` longtext NOT NULL,
  PRIMARY KEY (`cf_id`)
) ENGINE=MyISAM AUTO_INCREMENT=21944 DEFAULT CHARSET=utf8;

-- MySQL dump 10.13  Distrib 5.7.9, for Win64 (x86_64)
--
-- Host: 192.168.11.227    Database: crm
-- ------------------------------------------------------
-- Server version	5.7.21-log
 
/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
 
--
-- Table structure for table `crm_expediente`
--
 
DROP TABLE IF EXISTS `crm_expediente`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
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
) ENGINE=InnoDB AUTO_INCREMENT=113229 DEFAULT CHARSET=utf8 COLLATE=utf8_spanish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
 
--
-- Table structure for table `crm_incidencia`
--
 
DROP TABLE IF EXISTS `crm_incidencia`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
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
) ENGINE=InnoDB AUTO_INCREMENT=18886 DEFAULT CHARSET=utf8 COLLATE=utf8_spanish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
 
--
-- Table structure for table `crm_respuesta`
--
 
DROP TABLE IF EXISTS `crm_respuesta`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
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
) ENGINE=InnoDB AUTO_INCREMENT=113323 DEFAULT CHARSET=utf8 COLLATE=utf8_spanish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;
 
/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;
 
-- Dump completed on 2026-10-06 13:39:51