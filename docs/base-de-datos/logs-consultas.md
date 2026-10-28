# Tabla de logs de consultas

La petición del **28 de octubre de 2026** autoriza crear únicamente la tabla `crm_logs_consulta_incidencias` en la copia local del CRM. El SQL de creación se conserva en [backend/sql/001-crear-logs-consulta-incidencias.sql](../../backend/sql/001-crear-logs-consulta-incidencias.sql), separado de la instantánea de referencia.

## Estructura

| Columna | Tipo MySQL | Propósito y valor predeterminado |
| --- | --- | --- |
| `id` | `BIGINT UNSIGNED NOT NULL AUTO_INCREMENT` | Identificador único del log y clave primaria |
| `FechaHoraPeticion` | `DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP` | Fecha y hora; si no se proporciona, toma el momento de inserción |
| `CodIncidencia` | `VARCHAR(255) NOT NULL` | Código introducido por la persona, conservado como texto |
| `Identificador` | `VARCHAR(255) NOT NULL` | DNI, correo o código AMB introducido por la persona |
| `Valida` | `BOOLEAN NOT NULL` | `1` si la consulta devuelve una incidencia; `0` si no la devuelve |

Se utiliza InnoDB y `utf8_spanish_ci`, como en la tabla local `crm_incidencia`. Las columnas de entrada admiten hasta 255 caracteres, cubriendo el formulario actual y permitiendo conservar códigos con ceros iniciales o sin coincidencia. El esquema no recorta ni normaliza las entradas.

En MySQL 5.7.21, `BOOLEAN` es un alias de `TINYINT(1)`. `Valida` exige un valor explícito y no tiene valor predeterminado; la futura lógica de escritura deberá proporcionar exclusivamente `0` o `1`. No se añade un `CHECK`, ya que esta versión no lo aplica.

No hay clave foránea entre `CodIncidencia` y `crm_incidencia.id`: un intento debe poder registrarse aunque el código no exista. Tampoco hay restricciones únicas sobre las entradas, pues puede repetirse una consulta. La única clave es `id`.

`FechaHoraPeticion` no tiene `ON UPDATE`. Su valor predeterminado utiliza la zona horaria de la sesión MySQL; la inspección local del 28 de octubre de 2026 devolvió `SYSTEM` con zona del servidor `UTC`. Cuando se implemente el registro, el backend podrá proporcionar el instante de recepción de la petición para distinguirlo del momento de inserción.

## Aplicación y alcance

El archivo contiene un único `CREATE TABLE`, sin `DROP`, `ALTER`, importaciones ni registros. Su ejecución es manual sobre la copia local autorizada. Si ya existe la tabla, la creación falla para que se revise su definición.

No se conecta este SQL al arranque de NestJS, Docker ni MySQL. El backend y el frontend conservan el comportamiento actual de consulta; todavía no se implementa la escritura de logs, ni endpoints o pantallas para consultarlos. La tabla queda inicialmente vacía.

No se ha aplicado este cambio a otros entornos. La autorización de esta tabla no amplía el alcance de acceso al CRM original.

## Verificación local del 28 de octubre de 2026

El SQL se ejecutó manualmente con la cuenta administrativa del servicio `db`, después de confirmar MySQL **5.7.21** y la ausencia de la tabla. La cuenta del backend rechazó `CREATE TABLE` por permisos; no se modificaron usuarios ni concesiones para realizar la creación.

`SHOW CREATE TABLE` e `information_schema` confirmaron los cinco campos, la clave primaria autoincremental, el valor predeterminado de fecha, el alias `tinyint(1)` de `Valida`, InnoDB, `utf8_spanish_ci` y ninguna clave foránea. `COUNT(*)` devolvió **0**; no se insertaron filas de prueba. La prueba de humo de la aplicación también terminó correctamente, según [validacion.md](../validacion.md).
