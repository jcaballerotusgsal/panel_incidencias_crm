# Relaciones verificadas

Claves foráneas declaradas en el MySQL local, consultadas el **23 de octubre de 2026**:

| Origen | Destino |
| --- | --- |
| `crm_incidencia.m_zona` | `crm_m_zona_poblaciones.id_m_zona` |
| `crm_actuacion.id_incidencia` | `crm_incidencia.id` |
| `crm_expediente.id_incidencia` | `crm_incidencia.id` |
| `crm_respuesta.id_incidencia` | `crm_incidencia.id` |

La consulta devuelve de cero a una fila de `crm_incidencia`, identificada por su clave primaria, después de comprobar el identificador. No incluye actuaciones, expedientes ni respuestas; no se presupone una única fila en esas tablas dependientes. El DDL parcial revisado inicialmente no incluía `crm_actuacion`, cuya relación sí se comprobó en los metadatos locales.

## Unión de líneas, sin clave foránea declarada

Se utiliza `LEFT JOIN crm_lineas_tusgsal_amb AS l ON i.m_linea = l.id_linea_amb`, con `crm_incidencia AS i`. Esta unión ya aparece en `atlas_vista_incidencias` dentro de `docs/db/esquema.sql` y ha sido solicitada por el usuario. No existe una FK declarada para `crm_incidencia.m_linea` en los metadatos locales revisados; no se crea ni se infiere esa restricción.

`crm_lineas_tusgsal_amb.id_linea_amb` es una clave primaria de una sola columna, verificada el **23 de octubre de 2026**. Cada incidencia tiene como máximo una correspondencia de línea. El `LEFT JOIN` mantiene la incidencia aunque `m_linea` sea null o no exista en el catálogo, devolviendo `nom_linea_tusgsal: null`. No se utiliza `LIMIT 1` para resolver duplicados de líneas: la unicidad de la clave evita esos duplicados.

No se añaden relaciones hipotéticas ni se modifican restricciones.

## Tabla de logs de consultas

`crm_logs_consulta_incidencias.CodIncidencia` conserva el código introducido como texto y no tiene clave foránea hacia `crm_incidencia.id`. La tabla debe poder recoger consultas sin coincidencia o con un código inexistente. La única clave es el `id` del log; no se añaden restricciones a las tablas originales. La estructura se describe en [logs-consultas.md](logs-consultas.md).
