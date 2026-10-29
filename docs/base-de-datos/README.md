# Datos del CRM usados por este módulo

## Procedencia y alcance

Verificación de **23 de octubre de 2026** contra los metadatos del servicio local `db`, MySQL **5.7.21**, mediante `information_schema.COLUMNS` y `KEY_COLUMN_USAGE`. También se revisó exclusivamente el DDL de `asd.sql`; no se ejecutó ese archivo.

La tabla existente es **`crm_incidencia`**, en singular. No existe `crm_incidencias` en la copia consultada. Se comprobaron sus 28 columnas, nulabilidad, intercalaciones y relaciones declaradas. Esto no certifica el esquema ni los permisos de otros despliegues.

Al iniciar la implementación original de la consulta no existían esta carpeta ni la instantánea `docs/base-de-datos/esquema.sql` mencionada en `AGENTS.md`. Estos documentos describen únicamente el alcance comprobado; no reconstruyen ni sustituyen una instantánea completa del CRM. No contienen registros ni credenciales.

Para la ampliación de líneas del **23 de octubre de 2026** se revisaron el DDL de `crm_lineas_tusgsal_amb` y la unión ya usada por `atlas_vista_incidencias` en [docs/db/esquema.sql](../db/esquema.sql). Se contrastaron columnas, nulabilidad, clave primaria y ausencia de FK de `m_linea` contra `information_schema` del MySQL local. La relación de lectura es `crm_incidencia.m_linea = crm_lineas_tusgsal_amb.id_linea_amb`. No se ejecutó ni modificó la instantánea.

La ampliación de estado del **28 de octubre de 2026** contrasta `crm_expediente` con el DDL de referencia y MySQL local: `id` es clave primaria, `estado` es `varchar(20)` nullable con `utf8_spanish_ci` e `id_incidencia` tiene índice no único y FK hacia `crm_incidencia.id`. La comprobación agregada no encontró varias filas por incidencia en esa copia; el esquema sí permite esa cardinalidad. Se devuelven todos los estados relacionados tras verificar el acceso, sin añadir columnas ni actualizar estados.

| Documento | Alcance |
| --- | --- |
| [diccionario.md](diccionario.md) | Columnas devueltas por la consulta |
| [relaciones.md](relaciones.md) | Claves foráneas verificadas y cardinalidad |
| [vistas.md](vistas.md) | Ausencia de uso de vistas en esta consulta |
| [logs-consultas.md](logs-consultas.md) | Tabla local de logs, estructura, creación manual y registro de intentos |
| [reglas-negocio.md](reglas-negocio.md) | Correspondencia confirmada de los campos del formulario |
| [pendientes.md](pendientes.md) | Aspectos no verificados y condiciones para ampliar el módulo |

El backend utiliza `mysql2`, consultas parametrizadas y la configuración `DB_*` de Compose. Lee las incidencias, su catálogo y los estados de `crm_expediente`, y escribe únicamente los intentos en `crm_logs_consulta_incidencias`. No hay ORM, sincronización, migraciones ni inicialización automática. La configuración debe apuntar a una copia local autorizada.

La ampliación solicitada el **28 de octubre de 2026** incorpora `crm_logs_consulta_incidencias` mediante un SQL de creación manual, aplicado al servicio local `db` y descrito en [logs-consultas.md](logs-consultas.md). En su creación se verificaron los cinco campos y la ausencia de filas. La petición posterior del mismo día autoriza registrar cada consulta validada; se implementa la inserción de logs sin modificar las tablas originales. Los permisos locales existentes ya permiten `INSERT` y no se cambian concesiones.
