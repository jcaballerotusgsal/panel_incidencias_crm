# Vistas

La consulta utiliza las tablas base `crm_incidencia` y `crm_lineas_tusgsal_amb`. No se consultan, crean, alteran ni recrean vistas ni sus definidores.

Se revisó en `docs/db/esquema.sql` la unión de `atlas_vista_incidencias` entre `crm_incidencia.m_linea` y `crm_lineas_tusgsal_amb.id_linea_amb`. El módulo reproduce solo esa unión para obtener `nom_linea_tusgsal`, después de verificar la clave primaria del catálogo local. No utiliza la vista completa, que también une respuestas y puede devolver varias filas por incidencia. El módulo representa el nombre ausente con null; no copia el marcador `--` de la vista.

No se ha realizado un inventario completo de vistas del CRM. Sus uniones, cardinalidad y permisos deberán verificarse antes de incorporarlas; las relaciones de [relaciones.md](relaciones.md) proceden de claves foráneas declaradas, no de uniones inferidas.
