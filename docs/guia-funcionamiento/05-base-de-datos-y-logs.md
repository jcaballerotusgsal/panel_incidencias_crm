# 05 · Base de datos y logs

La aplicación reutiliza una copia local del esquema de un CRM existente. La versión requerida es **MySQL 5.7.21**. Este módulo no crea una base nueva con reglas inventadas ni modifica automáticamente las tablas originales.

Los nombres se conservan tal como existen. La tabla de incidencias utilizada es `crm_incidencia`, en singular; el identificador del catálogo de líneas es `id_linea_amb`. La procedencia y las verificaciones históricas están en [el índice de datos](../base-de-datos/README.md). Este capítulo explica esas comprobaciones y el SQL del código; no realiza una inspección nueva de registros reales.

## Tablas que intervienen

| Tabla | Uso actual | Operación del módulo |
| --- | --- | --- |
| `crm_incidencia` | Datos de la incidencia, contacto y acontecimiento | SELECT condicionado por código e identificador |
| `crm_lineas_tusgsal_amb` | Nombre legible de la línea de la incidencia | LEFT JOIN durante la lectura |
| `crm_expediente` | Estados de los expedientes relacionados con la incidencia encontrada | SELECT posterior por `id_incidencia` |
| `crm_logs_consulta_incidencias` | Historial de intentos de consulta | INSERT de un log por petición validada |

No se lee `crm_users` ni se devuelven contraseñas. La ficha tampoco consulta actuaciones o respuestas del CRM. La «Zona» muestra el valor de `m_zona`: este flujo no incorpora un JOIN para obtener el nombre de la población.

## Cómo se encuentra la incidencia

El SQL está en [IncidenciasRepository.findByCredentials](../../backend/src/incidencias/incidencias.repository.ts). Su condición principal es:

```sql
WHERE i.id = ? AND (
  TRIM(i.dp_dni) = ?
  OR TRIM(i.dp_email) = ?
  OR TRIM(i.dp_apellidos) = ?
)
```

La lista de parámetros es `[id, identificador, identificador, identificador]`. Para el código sintético `"00417"`, el servicio busca el número `417`, aunque guarda el texto original en el log. El identificador se recorta en sus extremos antes de comparar; el SQL recorta también los extremos de las columnas. No hace coincidencias parciales ni elimina espacios interiores o signos.

Los paréntesis hacen que siempre deba coincidir el id **y** uno de los tres identificadores. `dp_apellidos` se compara con el código AMB por la regla indicada para este CRM; no significa que cualquier apellido sea un código AMB ni autoriza a reinterpretar datos históricos.

Los `?` son marcadores de valores. El SQL permanece fijo y los datos se entregan separados al driver mediante `execute`, en lugar de concatenarse en el texto SQL. No se pueden usar esos parámetros para elegir arbitrariamente tablas o columnas desde el navegador.

El SELECT enumera las columnas, en vez de usar `SELECT *`, y lleva `LIMIT 1`. La clave primaria de la incidencia y la clave primaria del catálogo son las que evitan duplicar la fila en esta lectura; el límite no resuelve una relación de varios expedientes.

## De id de línea a nombre de línea

La unión utilizada es:

```sql
LEFT JOIN crm_lineas_tusgsal_amb AS l
  ON i.m_linea = l.id_linea_amb
```

`m_linea` contiene el identificador, mientras que `nom_linea_tusgsal` contiene el texto que se presenta. Por ejemplo, un id sintético `7` podría corresponder al nombre `B1`. Los números de este ejemplo no certifican una correspondencia real.

`LEFT JOIN` conserva la incidencia aunque no tenga línea o el id no se encuentre en el catálogo. En ese caso el nombre es null y la ficha muestra «No informado». Existe una regla de unión de lectura, pero no una clave foránea declarada entre `m_linea` e `id_linea_amb`; el módulo no crea esa restricción.

## Por qué el estado es una lista

Después de encontrar la pareja de datos se ejecuta esta segunda lectura, con el id de la incidencia encontrada:

```sql
SELECT estado
FROM crm_expediente
WHERE id_incidencia = ?
ORDER BY id ASC
```

Aquí sí hay una FK declarada desde `crm_expediente.id_incidencia` a `crm_incidencia.id`. El índice de `id_incidencia` no es único, por lo que una incidencia puede tener varios expedientes. Se usa una lectura aparte para devolver una sola incidencia con una lista `estados_expedientes`, sin multiplicar sus datos personales por cada expediente.

| Datos relacionados | Respuesta API | Presentación |
| --- | --- | --- |
| Ningún expediente | `[]` | Sin expediente |
| Un expediente con estado nulo | `[null]` | No informado |
| Dos textos distintos | `["ejemplo A", "ejemplo B"]` | ejemplo A · ejemplo B |
| Dos textos iguales | `["ejemplo A", "ejemplo A"]` | ejemplo A |

El orden por id es determinista; no prueba cuál es el estado más reciente. El código no elige un expediente vigente ni impone `pendiente`, `en revision` o `cerrada`. Tampoco añade un campo de estado a `crm_incidencia`: lee el estado existente de los expedientes.

## Qué contiene cada log

Abre [LogsConsultasRepository](../../backend/src/incidencias/logs-consultas.repository.ts) y la [documentación de la tabla](../base-de-datos/logs-consultas.md).

| Campo | Cómo se obtiene |
| --- | --- |
| `id` | MySQL genera un identificador autoincremental |
| `FechaHoraPeticion` | Instante de inicio del servicio, enviado expresamente como texto UTC con precisión de segundos |
| `CodIncidencia` | Código recibido, convertido a texto sin perder ceros si llegó como cadena |
| `Identificador` | Texto recibido, incluidos los espacios exteriores originales |
| `Valida` | `1` si el repositorio devolvió la incidencia completa; `0` si no la devolvió |

En MySQL 5.7, `BOOLEAN` se representa como `TINYINT(1)`; el repositorio envía 0 o 1. `Valida` no indica si el cuerpo JSON pasó la validación: un cuerpo válido que no encuentra datos produce `Valida = 0`. Si falla la lectura de expedientes, el repositorio tampoco devuelve la incidencia completa y se intenta registrar 0.

No se registra un 400 del DTO, una validación local que evita el envío o un GET de salud. Cada petición de consulta que supera el DTO intenta insertar una fila; las repeticiones no se agrupan. Si MySQL falla, el intento de registro puede fallar también.

La tabla no tiene FK desde `CodIncidencia`: debe admitir códigos inexistentes. Su `DEFAULT CURRENT_TIMESTAMP` solo se aplica si no se envía fecha; este flujo proporciona siempre su propio instante UTC. Un `DATETIME` almacena ese texto sin añadir información de zona horaria.

El log y las lecturas no forman una transacción conjunta. El servicio exige confirmación del INSERT antes de entregar el resultado, pero eso no convierte el historial en una auditoría infalible ante fallos de red. Los logs contienen identificadores personales y todavía no existe una pantalla ni un endpoint para listarlos.

## Datos que llegan frente a datos que se ven

La API devuelve 30 propiedades de incidencia y la ficha presenta 21 campos. Los ocho campos excluidos visualmente son `nombre_corto`, `e_matricula`, `e_conductor`, `e_fecha`, `e_tempo`, `dp_sexo`, `dp_idioma` y `atendido_por`. Además, la ficha presenta el nombre de línea en lugar del id `m_linea`.

Ocultar un campo de React no impide que un cliente de la API lo reciba. La selección de datos públicos debe revisarse en el backend cuando se sustituya esta salida provisional. El [diccionario](../base-de-datos/diccionario.md) detalla las columnas y sus tipos, incluidos los nulos.

## Estructura y cambios de esquema

[001-crear-logs-consulta-incidencias.sql](../../backend/sql/001-crear-logs-consulta-incidencias.sql) documenta la creación manual autorizada de la tabla de logs local. No se ejecuta desde el arranque de NestJS o Docker. No hay ORM ni sincronización automática de tablas.

Los volcados SQL de referencia no son instrucciones de instalación: pueden contener operaciones destructivas y su contenido no debe ejecutarse como parte de esta lectura. Cualquier escritura nueva sobre el CRM requiere confirmar reglas, destino, permisos y autorización; las cuestiones aún abiertas están en [pendientes de datos](../base-de-datos/pendientes.md).

[← API y consulta](04-api-y-consulta.md) · [Siguiente: Docker y configuración →](06-docker-y-configuracion.md)
