# API del backoffice

Prefijo global en NestJS: `/api`.

| Método | Ruta | Función |
| --- | --- | --- |
| GET | `/api` | Identificación de la API |
| GET | `/api/health` | Liveness del proceso NestJS |
| POST | `/api/incidencias/consulta` | Consulta una incidencia por código e identificador |
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

El nombre procede de `LEFT JOIN crm_lineas_tusgsal_amb AS l ON i.m_linea = l.id_linea_amb`. La clave primaria de `id_linea_amb`, verificada en MySQL local, impide duplicar la incidencia. Se conserva `m_linea` como número o null y se añade `nom_linea_tusgsal` como cadena o null, con 29 propiedades en total. Sin línea, sin correspondencia o con nombre nulo, la incidencia sigue devolviéndose y el nombre es null. No se consulta la vista completa del CRM ni se incorporan sus respuestas dependientes.

| Estado | Respuesta |
| --- | --- |
| 200 | `{ "incidencia": { ... } }` con las 28 columnas y `nom_linea_tusgsal`, documentados en [diccionario.md](base-de-datos/diccionario.md); `Cache-Control: no-store` |
| 400 | Error de validación; no se ejecuta la consulta ni se crea un log |
| 404 | `{ "message": "No se han encontrado los datos.", "error": "Not Found", "statusCode": 404 }` |
| 503 | Consulta no configurada, fallo de lectura o imposibilidad de guardar el log; mensaje público sin SQL, identificadores ni credenciales |

Las fechas son cadenas de MySQL y los nulos se conservan. La salida provisional incluye datos personales de una sola fila, tal como se ha solicitado; no incorpora `crm_users`, contraseñas ni registros relacionados. El criterio de acceso es la coincidencia de ambos datos, para el desarrollo local autorizado. Antes de habilitarlo fuera de ese entorno deben definirse autenticación, permisos y límites de petición.

El formulario navega a `/incidencias/resultado` tanto para un resultado como para un 404. La ficha presenta 20 campos y muestra `nom_linea_tusgsal` bajo «Línea» en lugar del id `m_linea`; si no hay nombre, muestra «No informado». Mantiene ocultos los ocho campos indicados en [reglas-negocio.md](base-de-datos/reglas-negocio.md). El frontend valida que el nombre recibido sea una cadena o null. Los errores de red, timeout o servicio permanecen en el formulario y permiten reintentar. El resultado vive únicamente en memoria del navegador; recargar o abrir directamente esa ruta exige consultar de nuevo. No se usan cookies ni almacenamiento persistente para guardar la fila.

### Registro de la consulta

Cada petición que supera la validación intenta insertar una fila en `crm_logs_consulta_incidencias`. Se guarda el instante de inicio del servicio en UTC, el código y el identificador recibidos, y `Valida = 1` si se encuentra la incidencia o `0` si no se encuentra. Una lectura que falla también intenta registrar `0` y conserva su respuesta 503. El servidor calcula este indicador; no lo acepta del navegador.

La inserción es parametrizada y debe confirmarse antes de devolver 200 o 404. Si falla, la API responde 503 con «No se ha podido registrar la consulta. Inténtalo de nuevo.», sin devolver la incidencia. Una caída de MySQL puede impedir también el propio registro. Dos peticiones iguales generan dos logs; no hay deduplicación de intentos. Los rechazos del DTO (400), rutas ajenas y validaciones del formulario que no envían una petición no escriben logs. No se añade un endpoint para listar los registros.

## Añadir un módulo

Crea su módulo en `backend/src/`, registra el módulo en `AppModule` y añade controladores, servicios y DTO. Las nuevas rutas bajo `/api` utilizan automáticamente la regla existente del frontend.

Antes de ampliar el acceso fuera del desarrollo local, implementar la autenticación y los permisos generales del CRM en NestJS. La coincidencia de código e identificador solo habilita la lectura provisional de la incidencia consultada.
