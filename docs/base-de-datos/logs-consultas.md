# Tabla de logs de consultas

La primera petición del **28 de octubre de 2026** autorizó crear únicamente la tabla `crm_logs_consulta_incidencias` en la copia local del CRM. La petición posterior del mismo día autoriza registrar las consultas en ella. El SQL de creación se conserva en [backend/sql/001-crear-logs-consulta-incidencias.sql](../../backend/sql/001-crear-logs-consulta-incidencias.sql), separado de la instantánea de referencia.

## Estructura

| Columna | Tipo MySQL | Propósito y valor predeterminado |
| --- | --- | --- |
| `id` | `BIGINT UNSIGNED NOT NULL AUTO_INCREMENT` | Identificador único del log y clave primaria |
| `FechaHoraPeticion` | `DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP` | Fecha y hora; si no se proporciona, toma el momento de inserción |
| `CodIncidencia` | `VARCHAR(255) NOT NULL` | Código introducido por la persona, conservado como texto |
| `Identificador` | `VARCHAR(255) NOT NULL` | DNI, correo o código AMB introducido por la persona |
| `Valida` | `BOOLEAN NOT NULL` | `1` si la consulta devuelve una incidencia; `0` si no la devuelve |

Se utiliza InnoDB y `utf8_spanish_ci`, como en la tabla local `crm_incidencia`. Las columnas de entrada admiten hasta 255 caracteres, cubriendo el formulario actual y permitiendo conservar códigos con ceros iniciales o sin coincidencia. El esquema no recorta ni normaliza las entradas.

En MySQL 5.7.21, `BOOLEAN` es un alias de `TINYINT(1)`. `Valida` exige un valor explícito y no tiene valor predeterminado; el repositorio proporciona exclusivamente `0` o `1` a partir del resultado de lectura. No se añade un `CHECK`, ya que esta versión no lo aplica.

No hay clave foránea entre `CodIncidencia` y `crm_incidencia.id`: un intento debe poder registrarse aunque el código no exista. Tampoco hay restricciones únicas sobre las entradas, pues puede repetirse una consulta. La única clave es `id`.

`FechaHoraPeticion` no tiene `ON UPDATE`. Su valor predeterminado utiliza la zona horaria de la sesión MySQL; la inspección local del 28 de octubre de 2026 devolvió `SYSTEM` con zona del servidor `UTC`. El backend siempre proporciona la fecha de inicio del servicio de consulta, después de validar el DTO, como texto UTC con precisión de segundos. Se conserva ese instante aunque la lectura o la inserción se demoren; no se utiliza la fecha de inserción predeterminada para este flujo.

## Aplicación y alcance

El archivo contiene un único `CREATE TABLE`, sin `DROP`, `ALTER`, importaciones ni registros. Su ejecución es manual sobre la copia local autorizada. Si ya existe la tabla, la creación falla para que se revise su definición.

No se conecta este SQL al arranque de NestJS, Docker ni MySQL. La tabla se creó inicialmente vacía y ahora recibe logs desde el backend. No se añaden endpoints o pantallas para listarlos.

No se ha aplicado este cambio a otros entornos. La autorización de esta tabla no amplía el alcance de acceso al CRM original.

## Registro desde la API

El frontend conserva el código y el identificador originales en el POST. El DTO acepta códigos numéricos o cadenas decimales de uno a diez dígitos en el rango permitido; así, `00417` busca el id 417 pero se registra como `00417`. Los espacios del identificador se recortan solo al buscar; el log conserva el valor recibido. La definición del contrato y los límites están en [api.md](../api.md).

`IncidenciasService` intenta guardar una fila por petición que supera la validación, mediante `LogsConsultasRepository` y un `INSERT` parametrizado. Con incidencia se registra `Valida = 1`; sin coincidencia se registra `0` y se mantiene el 404. Si falla la lectura se intenta guardar `0` y se mantiene el error de servicio. Cada reenvío es un intento independiente con un nuevo `id`.

La escritura debe confirmarse antes de devolver 200 o 404. Si falla, se responde 503 con un mensaje público sin SQL ni datos personales y no se entrega la incidencia. Una caída de MySQL puede impedir tanto leer como registrar el intento. Los rechazos 400, las validaciones del formulario que no llegan a la API y las rutas ajenas a la consulta no generan registros.

La cuenta local ya dispone de inserción; no se modifican concesiones. El permiso mínimo adicional requerido por el flujo es `INSERT` sobre esta tabla; las incidencias y el catálogo siguen siendo fuentes de lectura. No se imprimen códigos ni identificadores en logs de consola ni errores del driver.

## Verificación de creación del 28 de octubre de 2026

El SQL se ejecutó manualmente con la cuenta administrativa del servicio `db`, después de confirmar MySQL **5.7.21** y la ausencia de la tabla. La cuenta del backend rechazó `CREATE TABLE` por permisos; no se modificaron usuarios ni concesiones para realizar la creación.

`SHOW CREATE TABLE` e `information_schema` confirmaron los cinco campos, la clave primaria autoincremental, el valor predeterminado de fecha, el alias `tinyint(1)` de `Valida`, InnoDB, `utf8_spanish_ci` y ninguna clave foránea. `COUNT(*)` devolvió **0**; no se insertaron filas de prueba. La prueba de humo de la aplicación también terminó correctamente, según [validacion.md](../validacion.md).

La validación posterior del registro ejecutó cinco peticiones HTTP sintéticas sobre un servidor de pruebas con el repositorio de logs real: confirmó cuatro filas en MySQL, dos válidas, una sin coincidencia y otra por error de lectura. El rechazo 400 no escribió. Se comprobaron ids distintos, UTC, repetición y conservación de ceros y espacios, sin modificar incidencias. Tras reiniciar el backend de desarrollo se verificó además un 404 a través de Next.js con su único log persistido. Estas comprobaciones y `test:smoke` generan registros sintéticos en la tabla de logs; no exportan registros del CRM.
