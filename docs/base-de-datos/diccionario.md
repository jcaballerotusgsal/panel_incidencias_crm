# Diccionario de crm_incidencia

Metadatos locales verificados el **23 de octubre de 2026**. `id` es clave primaria `int(11)`; solo `id`, `fecha_recepcion` y `via_recepcion` son no nulos. Las demás columnas permiten `NULL`.

| Columnas | Tipo MySQL |
| --- | --- |
| `id`, `m_linea`, `m_zona`, `e_tempo` | `int(11)` |
| `fecha_recepcion`, `incidencia_created_date`, `incidencia_date_updated` | `datetime` |
| `m_fechaAcontecimiento_date`, `e_fecha` | `date` |
| `via_recepcion`, `dp_sexo`, `dp_idioma`, `m_tipo` | `varchar(20)` |
| `atendido_por`, `dp_nombre`, `dp_apellidos`, `dp_telefono`, `dp_email`, `m_vehiculo` | `varchar(45)` |
| `dp_dni`, `e_matricula` | `varchar(10)` |
| `m_hora` | `varchar(40)` |
| `m_parada`, `m_sentido` | `varchar(80)` |
| `e_conductor` | `varchar(60)` |
| `dp_correoPostal`, `m_detalle`, `nombre_corto` | `longtext` |

Las columnas de texto usan `utf8_spanish_ci`, excepto `dp_dni`, que usa `utf8_general_ci`. Se conservan sus comparaciones; no se fuerzan otras intercalaciones ni mayúsculas/minúsculas. `m_zona` tiene un índice no único y una clave foránea; los identificadores personales no son claves únicas.

El formulario relaciona código con `id`, DNI con `dp_dni`, correo con `dp_email` y código AMB con `dp_apellidos`, según la instrucción del usuario. No se interpreta todo apellido histórico como un código AMB válido.

La respuesta enumera estas 28 columnas de una sola fila, incluidos valores nulos, y añade `nom_linea_tusgsal` desde el catálogo de líneas y `estados_expedientes` desde sus expedientes (30 propiedades). Las fechas se serializan como texto de MySQL, sin introducir conversiones de zona horaria. Los campos de actualización no se interpretan como actualización automática.

## Catálogo crm_lineas_tusgsal_amb

Metadatos locales verificados el **23 de octubre de 2026** y contrastados con `docs/db/esquema.sql`:

| Columna | Tipo | Nulabilidad y clave |
| --- | --- | --- |
| `id_linea_amb` | `int(11)` | No nulo, clave primaria única |
| `nom_linea_tusgsal` | `varchar(5)`, `utf8_general_ci` | Permite NULL |

`crm_incidencia.m_linea` referencia el valor `id_linea_amb` para esta lectura, sin una FK declarada entre ambos campos. El `LEFT JOIN` conserva incidencias sin línea o sin correspondencia; `nom_linea_tusgsal` será null en esos casos. La ficha muestra este nombre bajo «Línea» y conserva el id original solo en la respuesta API.

Desde el **29 de octubre de 2026**, `GET /api/lineas` también ofrece este catálogo para el formulario de nueva queja. Enumera id y nombre, excluye nombres nulos o vacíos tras `TRIM` y ordena por nombre e id. Mantiene cada identificador aunque se repita el nombre. El desplegable muestra `nom_linea_tusgsal` y conserva `id_linea_amb` como valor; no añade un campo `id_amb` ni escribe en la tabla.

## Catálogo crm_m_zona_poblaciones

Metadatos locales contrastados el **30 de octubre de 2026** para la v2:

| Columna | Tipo | Nulabilidad y clave |
| --- | --- | --- |
| `id_m_zona` | `int(11)` | No nulo, clave primaria |
| `poblacion` | `varchar(45)`, `utf8_general_ci` | Permite NULL |

`GET /api/poblaciones` enumera estos dos campos, excluye nombres nulos o vacíos tras TRIM y ordena por población e id. El formulario muestra el nombre y envía `zona` con ese id, o null si no se especifica. El alta comprueba la opción antes de guardarla en `m_zona` mediante su FK existente. La ficha de consulta conserva su presentación actual de `m_zona`; esta ampliación no añade una unión de población a su respuesta.

## Estados de crm_expediente

Metadatos locales verificados el **28 de octubre de 2026** y contrastados con `docs/db/esquema.sql`:

| Columna | Tipo | Uso |
| --- | --- | --- |
| `id` | `int(11)`, no nulo, clave primaria | Orden determinista de los expedientes; no se interpreta como fecha |
| `id_incidencia` | `int(11)`, nullable, índice no único | FK hacia `crm_incidencia.id` |
| `id_resolucion` | `int(11)`, nullable, índice no único | FK hacia `crm_respuesta.id_respuesta`, contrastada el 30 de octubre de 2026 para el alta |
| `estado` | `varchar(20)`, nullable, `utf8_spanish_ci` | Texto de estado recibido del CRM, sin imponer nuevos valores |

`estados_expedientes` es una lista JSON de cadenas o null: conserva una entrada por expediente, incluidos repetidos y nulos, ordenados por `id`. `[]` significa que no hay expedientes relacionados. La ficha presenta los estados distintos como texto en «Estado»; no elige uno como vigente ni cambia datos del CRM. No se devuelve el resto de columnas de los expedientes.

## Respuesta inicial de crm_respuesta

Metadatos locales contrastados el **30 de octubre de 2026** para el alta de quejas:

| Columnas | Tipo y nulabilidad |
| --- | --- |
| `id_respuesta` | `int(11)`, no nulo, PK autoincremental |
| `id_incidencia` | `int(11)`, no nulo, FK hacia `crm_incidencia.id` |
| `estado`, `estado2` | `varchar(20)`, no nulos, `utf8_spanish_ci` |
| `fecha` | `date`, nullable |
| `medio` | `varchar(20)`, nullable, `utf8_spanish_ci` |
| `tiempo` | `int(11)`, nullable |
| `respuesta`, `observaciones` | `longtext`, nullable, `utf8_spanish_ci` |
| `respuesta_created_date`, `respuesta_date_updated` | `datetime`, nullable, default `CURRENT_TIMESTAMP`, sin `ON UPDATE` |

El alta proporciona expresamente todas estas columnas salvo el id generado. Los textos iniciales y el uso de dirección, motivo, idioma vacío y fechas se describen en [altas-quejas.md](altas-quejas.md); no se cambian tipos ni defaults. Las nuevas filas usan `dp_apellidos` como apellidos del formulario; la regla histórica de consulta por AMB no se aplica para transformar su contenido al crear.
