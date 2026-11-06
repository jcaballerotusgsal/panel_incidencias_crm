# Alta transaccional de quejas

La petición del **30 de octubre de 2026** autoriza crear una incidencia, una respuesta y un expediente en la copia local del CRM, siguiendo ese orden. Antes de cambiar el código se crea el punto de guardado `27735fb`, `maquetacion formulario nueva queja`; el directorio ya estaba limpio tras `4f7dee6`.

La v1 funcional se guarda después en `0a8d018`, `feat: guardar v1 del formulario de nueva queja`, antes de implementar la v2 solicitada el mismo día. La especificación siguiente incorpora esa v2: población opcional por id y Lugar como prefijo del detalle. El orden de las tres tablas y la transacción se conservan.

## Procedencia y alcance verificado

Se contrastan `information_schema` y el DDL de referencia, sin ejecutar el volcado. MySQL local es **5.7.21**; las tres tablas y el catálogo usan InnoDB. No existe `crm_incidencias`: se utiliza `crm_incidencia`. La inspección del 30 de octubre no encontraba triggers sobre estas tablas y confirmó los permisos de lectura e inserción existentes de la cuenta del backend, sin cambiar concesiones. La ampliación del 4 de noviembre añade manualmente el trigger de estado y la cola descritos en [notificaciones-correo.md](notificaciones-correo.md).

`crm_respuesta.id_incidencia` referencia `crm_incidencia.id`. `crm_expediente` tiene FKs a la incidencia por `id_incidencia` y a la respuesta por `id_resolucion → crm_respuesta.id_respuesta`. No se añaden relaciones, índices, columnas ni restricciones.

## 1. crm_incidencia

| Columna | Valor del alta |
| --- | --- |
| `id` | AUTO_INCREMENT de MySQL; no se acepta del navegador |
| `fecha_recepcion` | Instante de recepción en el servicio, desde el reloj del servidor |
| `via_recepcion` | `formulario web` |
| `atendido_por` | NULL |
| `dp_nombre`, `dp_apellidos` | Nombre y apellidos del formulario, sin reinterpretar los apellidos como AMB |
| `dp_dni`, `dp_telefono`, `dp_email` | DNI, teléfono y correo; DNI/teléfono ausentes se guardan NULL |
| `dp_sexo` | NULL; no hay campo de sexo en el formulario |
| `dp_idioma` | Cadena vacía, admitida por el esquema; no se necesita el fallback `ca` |
| `dp_correoPostal` | `dirección Cp: código postal`; un componente ausente no elimina el otro, sin ambos NULL |
| `m_tipo` | `Queja` |
| `m_fechaAcontecimiento_date` | Fecha del suceso convertida de `dd-mm-aaaa` a `aaaa-mm-dd` |
| `m_hora` | Hora del suceso `hh:mm` |
| `m_linea` | `id_linea_amb` comprobado en el catálogo con nombre disponible |
| `m_vehiculo`, `m_parada`, `m_sentido` | Valores del formulario; ausentes como NULL |
| `m_zona` | `id_m_zona` de la población seleccionada, validado en el catálogo; NULL si se omite |
| `m_detalle` | `[Lugar proporcionado por el usuario: LUGAR] Motivo` cuando se informa Lugar; sin Lugar, solo Motivo; sin ambos, NULL |
| `nombre_corto` | NULL |
| `incidencia_created_date`, `incidencia_date_updated` | Mismo instante que recepción, proporcionado expresamente |
| `e_matricula`, `e_conductor`, `e_fecha`, `e_tempo` | NULL |

El nombre solicitado como `dp_codigoPostal` no existe en esta tabla: el campo postal disponible y utilizado es `dp_correoPostal`. La v2 cambia la indicación inicial sobre Lugar: ahora se guarda al principio de `m_detalle`, con corchetes y los espacios indicados en el formato. La aclaración posterior elimina los paréntesis alrededor de Lugar y Motivo. Con Lugar y sin Motivo se guarda solo la anotación entre corchetes. Se conservan los saltos de línea y el texto literal, sin interpretar HTML. No se modifica el detalle de registros anteriores.

La población procede de `crm_m_zona_poblaciones`, con `id_m_zona` como PK `int(11)` y `poblacion` como `varchar(45)` nullable con `utf8_general_ci`, contrastados en MySQL 5.7.21 el 30 de octubre. Se utiliza la FK ya declarada desde `crm_incidencia.m_zona`; no se crea ni altera. El catálogo solo ofrece nombres no nulos ni vacíos. No se deduce la zona del texto libre de Lugar.

## 2. crm_respuesta

| Columna | Valor del alta |
| --- | --- |
| `id_respuesta` | AUTO_INCREMENT de MySQL |
| `id_incidencia` | Id obtenido en el paso 1 |
| `estado` | `pendiente` |
| `fecha` | Día de la recepción |
| `medio` | `correo electronico`, únicamente como dato; no dispara un envío desde este módulo |
| `tiempo` | NULL |
| `respuesta` | Cadena vacía |
| `estado2` | `abierta` |
| `observaciones` | Cadena vacía |
| `respuesta_created_date`, `respuesta_date_updated` | Mismo instante que la incidencia |

Los dos estados mencionados en la petición corresponden a las columnas distintas `estado` y `estado2`, verificadas en la copia local. Se proporcionan explícitamente los textos indicados; no se deducen estados permitidos de los valores predeterminados del DDL.

## 3. crm_expediente

| Columna | Valor del alta |
| --- | --- |
| `id` | AUTO_INCREMENT de MySQL |
| `id_incidencia` | Id obtenido en el paso 1 |
| `id_resolucion` | `id_respuesta` obtenido en el paso 2 |
| `estado` | `Pendiente` |

## Fechas, transacción y resultado

El servicio captura una sola fecha/hora al entrar tras validar el DTO y la expresa en **Europe/Madrid**, incluyendo su horario de verano. Ese texto se usa en todos los campos de registro; `fecha` de respuesta usa solo el día. La zona del servidor MySQL local sigue siendo UTC y no se modifica. `DATETIME` conserva el texto recibido sin zona; este flujo no depende de los defaults ni añade actualización automática. Los logs de búsqueda conservan su política previa UTC.

`DatabaseService.transaction` obtiene una conexión, inicia BEGIN, comprueba línea y población seleccionadas con bloqueo compartido, ejecuta los tres INSERT del CRM, registra dos avisos de alta en `crm_notificaciones_correo` y confirma COMMIT. Los avisos comparten el mismo UUID de evento, con una fila para el correo del formulario y otra para el destinatario interno. Si falla cualquiera de estas inserciones, se revierte la operación completa. Una población no disponible responde 400 antes de insertar. Sin zona se omite esa segunda lectura y se conserva la compatibilidad con los cuerpos de la v1. Cada inserción debe devolver una única fila y un id autoincremental seguro. Ante errores intenta ROLLBACK; libera la conexión o la destruye si falla la reversión. La respuesta HTTP 201 solo se entrega después del COMMIT, con el código y `Pendiente`.

No se usa `MAX(id)` ni una lectura de ids compartida: se utilizan los `insertId` de esa conexión. Las secuencias autoincrementales pueden dejar huecos al revertir una operación, sin que existan filas parciales. No se resetean secuencias.

## Verificación y límites

Las pruebas automatizadas del backend usan datos sintéticos y conexiones simuladas para comprobar orden, parámetros, ids, COMMIT, ROLLBACK y errores. La prueba adicional en MySQL ejecuta el SQL real sobre filas sintéticas y revierte siempre, incluso en el caso completo, antes de devolver la conexión; verifica que no quedan filas. No se crean tablas de prueba, no se modifican registros existentes y no se hace una nueva comprobación positiva de incidencias reales.

No se prueba un alta persistente contra el endpoint local con registros de usuario: los ensayos de navegador simulan sus respuestas. Una confirmación perdida en red puede ocultar al cliente una transacción completa; no hay deduplicación ni reenvío automático. La conservación de logs, autenticación general y despliegue fuera de la copia local mantienen sus pendientes. Véanse [API](../api.md) y [validación](../validacion.md).
