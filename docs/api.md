# API del backoffice

Prefijo global en NestJS: `/api`.

| Método | Ruta | Función |
| --- | --- | --- |
| GET | `/api` | Identificación de la API |
| GET | `/api/health` | Liveness del proceso NestJS |
| POST | `/api/incidencias/consulta` | Consulta una incidencia por código e identificador |
| POST | `/api/quejas` | Crea incidencia, respuesta y expediente en una transacción |
| GET | `/api/lineas` | Catálogo de nombres e ids de líneas para el formulario de queja |
| GET | `/api/poblaciones` | Catálogo de poblaciones e ids de zona para el formulario de queja |
| GET | `/api/docs` | Swagger cuando `ENABLE_SWAGGER=true` |

El frontend reenvía las rutas `/api/*` al backend. La ruta adicional `/health` pertenece al propio Next.js.

## GET /api/health

Ejemplo ilustrativo; la fecha y el tiempo de actividad se calculan en cada llamada:

```json
{
  "status": "ok",
  "service": "backoffice-api",
  "timestamp": "2026-10-14T09:36:00.000Z",
  "uptimeSeconds": 24,
  "database": "not-checked"
}
```

Respuesta: HTTP 200 y `Cache-Control: no-store`.

El campo `database: "not-checked"` indica que este endpoint solo comprueba el proceso. El módulo de incidencias sí conecta con MySQL, pero `/api/health` no ejecuta SQL ni certifica disponibilidad de datos.

## POST /api/incidencias/consulta

Cuerpo JSON, ejemplo enteramente sintético:

```json
{
  "codigoIncidencia": "00417",
  "identificador": "prueba@example.invalid"
}
```

`codigoIncidencia` admite un número entero de 1 a 2147483647 o una cadena de uno a diez dígitos cuyo valor esté en ese rango. No acepta espacios, signos, decimales o notación exponencial en las cadenas, ni booleanos u objetos. `identificador` debe ser una cadena no vacía de hasta 45 caracteres. El DTO rechaza campos adicionales, incluido un supuesto `Valida` proporcionado por el cliente.

El frontend envía ambos campos originales por POST a `/api`, sin incluirlos en rutas ni parámetros de URL. El código de texto permite conservar ceros iniciales en el log; para buscar se convierte explícitamente a número. El identificador se guarda antes de recortar sus espacios exteriores para la comparación.

La consulta parametrizada exige `i.id = ? AND (TRIM(i.dp_dni) = ? OR TRIM(i.dp_email) = ? OR TRIM(i.dp_apellidos) = ?)` sobre **`crm_incidencia AS i`**, nombre singular verificado en la copia local. Correo corresponde a `dp_email`; AMB corresponde a `dp_apellidos` según la regla indicada por el usuario. Se conservan las intercalaciones existentes. Se enumeran las 28 columnas de incidencia más `nom_linea_tusgsal`, con `LIMIT 1` y sin `SELECT *`.

El nombre procede de `LEFT JOIN crm_lineas_tusgsal_amb AS l ON i.m_linea = l.id_linea_amb`. La clave primaria de `id_linea_amb`, verificada en MySQL local, impide duplicar la incidencia. Se conserva `m_linea` como número o null y se añade `nom_linea_tusgsal` como cadena o null. Sin línea, sin correspondencia o con nombre nulo, la incidencia sigue devolviéndose y el nombre es null. No se consulta la vista completa del CRM ni se incorporan sus respuestas dependientes.

Después de comprobar la pareja de datos, una segunda lectura parametrizada obtiene `crm_expediente.estado` mediante `WHERE id_incidencia = ? ORDER BY id ASC`, usando el id de la incidencia encontrada. La respuesta añade `estados_expedientes` como lista de cadenas o null, una entrada por expediente, con 30 propiedades en total dentro de `incidencia`. Sin expedientes devuelve `[]`; un expediente con estado nulo produce `[null]`. Se conservan todos los estados y su orden por id, sin inferir prioridad o vigencia. No se consultan expedientes si la primera lectura no encuentra la pareja.

| Estado | Respuesta |
| --- | --- |
| 200 | `{ "incidencia": { ... } }` con las 28 columnas, `nom_linea_tusgsal` y `estados_expedientes`, documentados en [diccionario.md](base-de-datos/diccionario.md); `Cache-Control: no-store` |
| 400 | Error de validación; no se ejecuta la consulta ni se crea un log |
| 404 | `{ "message": "No se han encontrado los datos.", "error": "Not Found", "statusCode": 404 }` |
| 503 | Consulta no configurada, fallo de lectura o imposibilidad de guardar el log; mensaje público sin SQL, identificadores ni credenciales |

Las fechas son cadenas de MySQL y los nulos se conservan. La salida provisional incluye datos personales de una sola incidencia y únicamente el estado de cada expediente relacionado; no incorpora `crm_users`, contraseñas ni otros datos de los expedientes. El criterio de acceso es la coincidencia de ambos datos, para el desarrollo local autorizado. Antes de habilitarlo fuera de ese entorno deben definirse autenticación, permisos y límites de petición.

El formulario navega a `/incidencias/resultado` tanto para un resultado como para un 404. La ficha presenta 21 campos y muestra `nom_linea_tusgsal` bajo «Línea» en lugar del id `m_linea`; si no hay nombre, muestra «No informado». «Estado» presenta los estados distintos de sus expedientes, separados por ` · `: sin expedientes muestra «Sin expediente», y los estados nulos o vacíos se presentan como «No informado». Mantiene ocultos los ocho campos indicados en [reglas-negocio.md](base-de-datos/reglas-negocio.md). El frontend valida la línea y la lista de estados; solo esta última propiedad admite una lista, con elementos de texto o null. Los errores de red, timeout o servicio permanecen en el formulario y permiten reintentar. El resultado vive únicamente en memoria del navegador; recargar o abrir directamente esa ruta exige consultar de nuevo. No se usan cookies ni almacenamiento persistente para guardar la fila.

### Registro de la consulta

Cada petición que supera la validación intenta insertar una fila en `crm_logs_consulta_incidencias`. Se guarda el instante de inicio del servicio en UTC, el código y el identificador recibidos, y `Valida = 1` si se encuentra la incidencia o `0` si no se encuentra. Una lectura que falla también intenta registrar `0` y conserva su respuesta 503. El servidor calcula este indicador; no lo acepta del navegador.

La inserción es parametrizada y debe confirmarse antes de devolver 200 o 404. Si falla, la API responde 503 con «No se ha podido registrar la consulta. Inténtalo de nuevo.», sin devolver la incidencia. Una caída de MySQL puede impedir también el propio registro. Dos peticiones iguales generan dos logs; no hay deduplicación de intentos. Los rechazos del DTO (400), rutas ajenas y validaciones del formulario que no envían una petición no escriben logs. No se añade un endpoint para listar los registros.

## POST /api/quejas

Alta autorizada en la copia local del CRM el **30 de octubre de 2026**. Ejemplo sintético de cuerpo JSON:

```json
{
  "nombre": "Nombre de prueba",
  "apellidos": "Apellidos de prueba",
  "direccion": "Calle de prueba, 12",
  "codigoPostal": "01234",
  "telefono": "000000000",
  "correo": "prueba@example.invalid",
  "dni": "PRUEBA123",
  "fecha": "30-10-2026",
  "hora": "14:30",
  "linea": 7,
  "zona": 9,
  "numeroVehiculo": "0012",
  "lugar": "Lugar sintético del suceso",
  "parada": "Parada de prueba",
  "sentido": "Dirección de prueba",
  "motivo": "Descripción sintética."
}
```

`nombre`, `apellidos`, `correo`, `fecha`, `hora` y `linea` son obligatorios. Los demás campos de texto pueden faltar, ser null o ser cadenas vacías. Se recortan los extremos de cadenas sin convertir tipos ni truncar valores. El DTO rechaza propiedades ajenas, incluidos ids generados, canal, idioma, estados y fechas de registro impuestos por el cliente.

La v2 añade `zona` como número entero opcional: se envía `id_m_zona`, no el nombre de población. Solo este nuevo campo opcional se omite o se envía como null para no especificar zona; no acepta la cadena vacía ni ids en texto. Los clientes de la v1 que no lo envían siguen guardando zona NULL.

| Campos | Límite o validación |
| --- | --- |
| `nombre`, `apellidos`, `telefono`, `correo`, `numeroVehiculo` | Hasta 45 caracteres; nombre y apellidos no vacíos, correo con formato de email |
| `dni` | Hasta 10 caracteres; sin deducir ni modificar su formato |
| `direccion`, `lugar` | Hasta 1000 caracteres |
| `codigoPostal` | Texto de hasta 20 caracteres, conserva ceros iniciales |
| `parada`, `sentido` | Hasta 80 caracteres |
| `motivo` | Hasta 20000 caracteres; sigue siendo opcional |
| `fecha` | Fecha real `dd-mm-aaaa`, años 1000–9999; no se impone una regla de pasado/futuro |
| `hora` | `hh:mm`, de 00:00 a 23:59 |
| `linea` | Número entero en el rango INT firmado; debe existir con nombre disponible en el catálogo |
| `zona` | Opcional, entero en el rango INT firmado o null; si se informa, debe existir con nombre disponible en `crm_m_zona_poblaciones` |

La línea y, si se informa, la población se comprueban dentro de la misma transacción con bloqueo compartido. Se insertan, en este orden, `crm_incidencia`, `crm_respuesta` y `crm_expediente`, enlazando los ids generados. Todas las operaciones usan una conexión, SQL fijo y valores parametrizados. Se espera el COMMIT para responder; ante fallos se intenta ROLLBACK y se destruye la conexión si no puede revertirse.

| HTTP | Significado |
| --- | --- |
| 201 | `{ "codigoIncidencia": 417, "estado": "Pendiente" }`, ejemplo sintético; `Cache-Control: no-store` |
| 400 | DTO inválido, línea o población no disponible; no se confirma ninguna fila del alta |
| 503 | No se pudo confirmar la operación; mensaje público sin SQL, credenciales ni datos personales |

Solo se devuelven código y estado, sin datos personales ni los ids de respuesta/expediente. Un único instante del servidor inicializa la recepción y los campos de registro, como DATETIME de **Europe/Madrid**; `crm_respuesta.fecha` usa su día. Las fechas de los logs de consulta anteriores conservan UTC. En la v2 se guarda la población por id en `m_zona` y se antepone Lugar al motivo como `[Lugar proporcionado por el usuario: LUGAR] Motivo` en `m_detalle`, con el formato sin paréntesis de la aclaración posterior. Dirección + CP conserva su formato en `dp_correoPostal`. Las constantes y las ausencias de campos se detallan en [altas-quejas.md](base-de-datos/altas-quejas.md).

El selector nativo del frontend produce `aaaa-mm-dd`; el formulario lo convierte a `dd-mm-aaaa` para este contrato existente, sin cambiar la validación ni el formato del backend.

Este POST no crea un log de consulta de incidencias ni envía correo. La transacción impide altas parciales; perder la confirmación por red puede dejar una queja completa creada sin que el cliente lo sepa. No hay idempotencia entre reintentos. Se mantiene el alcance local autorizado; esta ampliación no añade autenticación general ni conexión a producción.

## GET /api/lineas

Sin cuerpo ni parámetros de entrada. Responde HTTP 200 y `Cache-Control: no-store`, con esta estructura de ejemplo sintético:

```json
{
  "lineas": [
    { "id_linea_amb": 7, "nom_linea_tusgsal": "B1" },
    { "id_linea_amb": 42, "nom_linea_tusgsal": "N2" }
  ]
}
```

Lee exclusivamente `id_linea_amb` y `nom_linea_tusgsal` de `crm_lineas_tusgsal_amb`, excluyendo nombres nulos o vacíos tras `TRIM`, y ordenando por nombre e id ascendente con la intercalación existente. Conserva nombres repetidos con ids distintos. Sin opciones devuelve `{ "lineas": [] }`. El nombre real de la clave es `id_linea_amb`, no `id_amb`.

Ante configuración ausente o fallo de MySQL responde 503 con «No se han podido cargar las líneas. Inténtalo de nuevo.», sin detalles de conexión. No requiere código de incidencia ni datos personales; no consulta incidencias ni crea logs. El catálogo no expone operaciones de escritura. `/quejas/nueva` utiliza el nombre como etiqueta y el id como valor antes de enviar el alta por POST; véase [formulario-queja.md](formulario-queja.md).

## GET /api/poblaciones

Catálogo añadido por la v2 del formulario, sin cuerpo ni parámetros. Respuesta 200 y `Cache-Control: no-store`; ejemplo sintético:

```json
{
  "poblaciones": [
    { "id_m_zona": 9, "poblacion": "Población de prueba" }
  ]
}
```

Enumera únicamente `id_m_zona` y `poblacion` de `crm_m_zona_poblaciones`, excluye nombres nulos o vacíos tras TRIM y ordena por nombre e id con la intercalación existente. No agrupa nombres repetidos con ids distintos. Un catálogo sin opciones devuelve `{ "poblaciones": [] }`. Si falla la lectura responde 503 con «No se han podido cargar las poblaciones. Inténtalo de nuevo.», sin SQL ni credenciales.

El formulario muestra el nombre y envía el id elegido como `zona` al POST. Sin selección, con catálogo vacío o indisponible puede omitir la zona. No se escriben poblaciones ni logs desde este endpoint y no se devuelven datos personales.

## Añadir un módulo

Crea su módulo en `backend/src/`, registra el módulo en `AppModule` y añade controladores, servicios y DTO. Las nuevas rutas bajo `/api` utilizan automáticamente la regla existente del frontend.

Antes de ampliar el acceso fuera del desarrollo local, implementar la autenticación y los permisos generales del CRM en NestJS. La coincidencia de código e identificador solo habilita la lectura provisional de la incidencia consultada.
