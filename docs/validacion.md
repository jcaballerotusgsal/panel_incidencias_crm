# Validación de la entrega

Fecha de preparación: **14 de octubre de 2026**.

## Revisiones ejecutadas

| Comprobación | Resultado |
| --- | --- |
| Parseo de los manifiestos y configuraciones JSON | Correcto |
| Parseo YAML de los dos archivos Compose | Correcto |
| Contextos de build, targets, dependencias y montajes declarados | Coherentes en revisión estática |
| Publicación de puertos limitada a loopback | Comprobada en ambos Compose |
| Sintaxis de TypeScript/TSX mediante transpilation | Sin errores detectados |
| Sintaxis JavaScript de scripts y salida transpilada | Sin errores detectados |
| Sintaxis de los dos scripts de shell | Correcta |
| Evaluación aislada de la configuración de Next.js | Rewrite interno, standalone y polling de desarrollo comprobados |
| URL de la API en el componente de navegador | Relativa, sin nombre interno de Docker |
| Política de lockfiles | Bootstrap en desarrollo; obligatorios en builds compilados |

Se realizaron 19 comprobaciones de código/configuración ejecutable y 9 comprobaciones de manifiestos/estructura. Los detalles están en [validacion-estatica.json](validacion-estatica.json).

El analizador TypeScript disponible en el entorno de preparación era **5.8.3**. La plantilla selecciona la rama **5.9**. La revisión por transpilation detecta errores sintácticos; no equivale a un typecheck completo contra las dependencias instaladas.

## Comprobaciones pendientes en un entorno con Docker y red

No se pudieron ejecutar `npm install`, la resolución de dependencias y creación de lockfiles, la compilación real de NestJS/Next.js, ESLint con sus paquetes, las pruebas HTTP incluidas, una prueba de navegador ni la construcción/puesta en marcha de las imágenes Docker.

Motivo: el entorno de preparación no dispone del comando/motor Docker y la conexión al registro npm no estaba disponible. No se simularon esos resultados ni se incluyeron lockfiles inventados.

Por tanto, esta entrega es un **proyecto base preparado y revisado estáticamente**, no una construcción Docker verificada de extremo a extremo. El resultado definitivo de compatibilidad se comprobará al instalar las dependencias, ejecutar las pruebas y construir las imágenes en el equipo de desarrollo.

Los comandos para realizar esas pruebas están en [docker.md](docker.md) y en el README de la raíz.

## Formulario inicial de consulta — 23 de octubre de 2026

La página inicial sustituye la bienvenida de ejemplo por un formulario visual con los campos «Código de incidencia» y «DNI, correo o código AMB». El botón está desactivado; no se envían datos ni se consulta la API desde el formulario. La prueba de humo existente se ha adaptado al nuevo título.

Comprobaciones ejecutadas sobre los contenedores de desarrollo del proyecto:

| Comprobación | Resultado |
| --- | --- |
| `docker compose exec frontend npm run typecheck` | Correcto |
| `docker compose exec frontend npm run lint` | Sin errores; una advertencia `import/no-anonymous-default-export` en `postcss.config.mjs`, archivo no modificado en este cambio |
| `docker compose exec frontend npm run test:smoke` | Correcto: Next.js, API interna y página inicial responden |

Estos resultados corresponden al formulario y no sustituyen la revisión histórica de la entrega inicial. En este cambio no se ha ejecutado una prueba con navegador real ni la construcción de imágenes compiladas.

## Consulta de incidencias por API — 23 de octubre de 2026

Esta revisión amplía el formulario visual anterior con lectura de MySQL y una página de resultados. Se incorporan `DatabaseModule` e `IncidenciasModule`, DTO, servicio y repositorio, el controlador `mysql2` con su manifiesto/lockfile, el formulario cliente, el contexto en memoria y `/incidencias/resultado`. Se actualizan la prueba de humo, los tests HTTP, la configuración de origen de desarrollo y la documentación de API, datos, arquitectura y arranque.

Se verificaron los metadatos de la copia local: MySQL **5.7.21**, tabla **`crm_incidencia`** en singular, 28 columnas y relaciones declaradas. No se ejecutó el SQL de referencia ni se crearon, alteraron o escribieron objetos o registros del CRM. La procedencia y las discrepancias están en [base-de-datos/README.md](base-de-datos/README.md).

| Comprobación ejecutada | Resultado |
| --- | --- |
| `docker compose config --quiet` | Correcto, sin imprimir credenciales |
| `docker compose exec backend npm run typecheck` | Correcto |
| `docker compose exec backend npm test` | Compilación NestJS y 23 pruebas correctas: DNI/correo/AMB, pareja incorrecta, validación, parámetros SQL y errores sin detalles internos |
| `docker compose exec frontend npm run typecheck` | Correcto |
| `docker compose exec frontend npm run lint` | Sin errores; permanece la advertencia previa de `postcss.config.mjs` |
| `docker compose exec frontend npm run test:smoke` | Correcto: salud, proxy, formulario, resultado, 400 y consulta sin coincidencia (404) |
| `docker compose run --rm --no-deps -e NODE_ENV=production --entrypoint npm frontend run build` | Compilación Next.js y comprobación TypeScript correctas; todas las rutas generadas |
| Lectura real a través de Next.js → API → MySQL local | Tres campos de identificación con coincidencia, 28 columnas y caso sin coincidencia correctos; solo se emitieron contadores, sin guardar ni registrar datos personales |
| Edge headless contra la compilación local, con respuestas sintéticas | Correcto: envío POST, navegación, resultado completo, contenido HTML tratado como texto, URL sin identificadores, recarga sin persistencia, ausencia de datos y errores recuperables de servicio/red/contrato |
| Edge headless contra el desarrollo restaurado, con respuestas sintéticas | Correcto: se repitió el mismo flujo tras autorizar el origen local de HMR |
| WebSocket de desarrollo desde `127.0.0.1` | HTTP 101 tras añadir exclusivamente ese loopback a `allowedDevOrigins`; antes el origen era rechazado |

La validación compilada utilizó un contenedor temporal, posteriormente detenido; se restauró el frontend de desarrollo. Las herramientas auxiliares de navegador se instalaron solo en `.local/`, sin añadir dependencias al frontend ni instalar paquetes globales. No se construyeron las imágenes de producción ni se añadió acceso a una base de producción.

Auditorías ejecutadas: el backend informa de **dos avisos moderados** en la cadena `@nestjs/swagger`/`js-yaml`; el frontend informa de **cinco avisos altos** en la cadena de herramientas de lint `eslint-config-next`/`braces`. Quedan pendientes de revisión; no se aplicó `npm audit fix --force` ni se cambiaron las ramas mayores elegidas. Estas auditorías no tienen resultado satisfactorio, aunque las comprobaciones funcionales anteriores sí lo tienen.

## Presentación de la ficha de resultados — 23 de octubre de 2026

Se sustituye el JSON de `resultado-incidencia.tsx` por una ficha adaptable con cabecera, detalle e información agrupada de incidencia, contacto, acontecimiento y fechas del registro. Se amplía el ancho de la página de resultados y se actualizan README, arquitectura, API y reglas de presentación.

Se muestran 20 campos mediante una selección explícita. Se excluyen `nombre_corto`, `e_matricula`, `e_conductor`, `e_fecha`, `e_tempo`, `dp_sexo`, `dp_idioma` y `atendido_por`; tampoco se muestran automáticamente campos desconocidos. El cambio es visual: el contrato API y las consultas de MySQL conservan su comportamiento.

| Comprobación ejecutada | Resultado |
| --- | --- |
| `docker compose exec frontend npm run typecheck` | Correcto |
| `docker compose exec frontend npm run lint` | Sin errores; permanece la advertencia previa de `postcss.config.mjs` |
| `docker compose exec frontend npm run test:smoke` | Correcto |
| Edge headless en escritorio (1280 px) y móvil (375 px), con datos sintéticos | Correcto: secciones, ocho campos ocultos, exclusión de campos nuevos, fechas legibles, nulos, conservación del cero, texto sin interpretar HTML y ausencia de desbordamiento horizontal en móvil |
| Flujo de consulta y estados en Edge | Correcto: envío, navegación, ausencia de coincidencia, recarga sin persistencia y recuperación ante errores |
| Revisión visual de capturas sintéticas | Escritorio y móvil revisados; capturas provisionales guardadas exclusivamente en `.local/browser/` |

No se han añadido dependencias ni modificado backend, esquema o datos del CRM. No se repitieron las pruebas del backend ni la compilación o construcción de imágenes de producción para este cambio de presentación. Los avisos de dependencias de la revisión anterior continúan pendientes.

## Nombre de línea en la ficha — 23 de octubre de 2026

El repositorio incorpora `LEFT JOIN crm_lineas_tusgsal_amb ON m_linea = id_linea_amb` y devuelve las 28 columnas originales más `nom_linea_tusgsal`. Se actualizan el contrato TypeScript del backend, su documentación de servicio, la validación de respuesta del frontend y el campo «Línea» de la ficha. Se mantienen los 20 campos visibles y las exclusiones anteriores.

Se contrastaron el DDL y la unión de `atlas_vista_incidencias` en `docs/db/esquema.sql` con los metadatos locales de MySQL 5.7.21. Se verificó que `id_linea_amb` es una clave primaria de una sola columna y que no hay FK declarada para `m_linea`. Por ello la unión mantiene una sola incidencia y devuelve nombre nulo cuando falta correspondencia. Se actualiza la documentación de API, arquitectura, diccionario, relaciones, vistas, reglas y permisos necesarios; no se altera el SQL de referencia ni el esquema.

| Comprobación ejecutada | Resultado |
| --- | --- |
| `docker compose exec backend npm run typecheck` | Correcto |
| `docker compose exec backend npm test` | Compilación NestJS y 23 pruebas correctas, con el nombre de línea en la respuesta y la unión parametrizada |
| SQL real del repositorio sobre tablas derivadas sintéticas en MySQL | Siete casos correctos: línea encontrada, sin correspondencia, id nulo, nombre nulo, id incorrecto, identificador incorrecto e intento de inyección; ninguna escritura |
| `docker compose exec frontend npm run typecheck` | Correcto |
| `docker compose exec frontend npm run lint` | Sin errores; permanece la advertencia previa de `postcss.config.mjs` |
| `docker compose exec frontend npm run test:smoke` | Correcto tras cargar la nueva versión del backend |
| Consulta real local a través de Next.js → API → MySQL | Correcto: se mantienen id y código de línea, coincide el nombre con el catálogo y se devuelven 29 propiedades; sin datos personales en la salida |
| Edge headless en escritorio y móvil, con datos sintéticos | Correcto: «Línea» muestra el nombre; muestra «No informado» sin línea o sin correspondencia y rechaza nombres de tipo no válido; se conserva el flujo de consulta y las exclusiones |

Se reinició el backend después de las compilaciones porque el proceso de desarrollo seguía sirviendo el contrato anterior. No se añadieron dependencias ni se modificaron registros, restricciones o permisos. No se repitieron la compilación del frontend ni la construcción de imágenes de producción; continúan pendientes los avisos de dependencias de la revisión anterior.

## Tabla de logs de consultas — 28 de octubre de 2026

Se crea la rama `feat/logs-consulta-incidencias` desde `develop` y se añade [backend/sql/001-crear-logs-consulta-incidencias.sql](../backend/sql/001-crear-logs-consulta-incidencias.sql). El único cambio de esquema es la nueva tabla local `crm_logs_consulta_incidencias`. Se documentan su estructura, aplicación y relación sin FK en `base-de-datos/`; no se modifica la instantánea SQL ni se implementa la escritura de logs.

| Comprobación ejecutada | Resultado |
| --- | --- |
| Versión y metadatos antes de crear | MySQL 5.7.21; no existía la tabla de logs |
| Aplicación manual del SQL en el servicio local `db` | Correcta con la cuenta administrativa; la cuenta del backend rechazó la creación por permisos; no se cambiaron concesiones |
| `SHOW CREATE TABLE` e `information_schema` | Cinco columnas correctas, `id` autoincremental y clave primaria, fecha predeterminada, `Valida` como `tinyint(1)`, InnoDB y `utf8_spanish_ci`; ninguna FK |
| `SELECT COUNT(*)` de la nueva tabla | 0 filas, sin insertar datos de prueba |
| `docker compose exec -T frontend npm run test:smoke` | Correcto: Next.js, API, formulario, resultado, validación y consulta sin coincidencia |

Solo se ejecuta el SQL de creación manual; no se añade inicialización automática ni código de aplicación. No se repiten compilaciones, lint, pruebas unitarias ni pruebas de navegador al no cambiar TypeScript, interfaz o dependencias. La tabla no se ha aplicado a otros entornos. Las comprobaciones históricas y los avisos de dependencias anteriores conservan su alcance.

## Registro automático de consultas — 28 de octubre de 2026

Primero se guarda la tabla y su documentación en el commit `3660d3d`, en `feat/logs-consulta-incidencias`. Después se incorpora `LogsConsultasRepository`, la inserción parametrizada en `DatabaseService` y la espera de su confirmación desde `IncidenciasService`. Se registra el instante de inicio del servicio en UTC, los campos recibidos y si se encontró una incidencia. El formulario conserva ceros iniciales y espacios; el DTO admite códigos numéricos o cadenas decimales válidas sin perder su representación.

Se escriben los intentos con coincidencia o sin ella, y se intenta registrar un fallo de lectura como no válido. Un fallo de log responde 503; los 400 no ejecutan SQL. Se actualizan API, arquitectura, datos, Docker y la documentación de la prueba de humo. No se cambian dependencias, concesiones, tablas originales ni el SQL de creación.

| Comprobación ejecutada | Resultado |
| --- | --- |
| `docker compose config --quiet` | Correcto, sin imprimir credenciales |
| Permisos efectivos del backend local | `INSERT` ya disponible; no se modifican usuarios ni concesiones |
| `docker compose exec -T backend npm run typecheck` | Correcto |
| `docker compose exec -T backend npm test` | Compilación NestJS y 38 pruebas correctas: identificadores, log de 200/404/503, espera de escritura, repetición, conservación de entradas, UTC, validación y errores públicos |
| `docker compose exec -T frontend npm run typecheck` | Correcto |
| `docker compose exec -T frontend npm run lint` | Sin errores; permanece la advertencia previa de `postcss.config.mjs` |
| HTTP de pruebas con lectura sintética y escritura MySQL real | Cinco peticiones y cuatro logs sintéticos correctos: dos coincidencias repetidas, 404 y fallo de lectura; ids distintos, valores originales y UTC; el 400 no inserta |
| Edge headless con respuestas sintéticas, escritorio y móvil | Correcto: envío de código con ceros e identificador con espacios, ficha, línea, ausencia de datos y recuperación ante errores |
| Next.js → API en ejecución → MySQL local | Correcto: un 404 sintético y un único log con los campos originales y `Valida = 0` |
| `docker compose exec -T frontend npm run test:smoke` | Correcto, también después de reiniciar el backend |

Se reinició únicamente el backend de desarrollo porque el proceso activo seguía sirviendo el DTO anterior tras compilar las pruebas; la verificación a través de Next.js se repitió con éxito. Las comprobaciones de almacenamiento y humo generan logs sintéticos, sin insertar ni modificar incidencias ni exportar datos personales. No se construyeron imágenes de producción ni se repitió la compilación del frontend; continúan pendientes los avisos de dependencias históricos.

## Estado de los expedientes en el detalle — 28 de octubre de 2026

La rama `feat/estado-expediente-incidencias` parte de `develop`. El repositorio añade una lectura parametrizada de `crm_expediente.estado` por `id_incidencia`, exclusivamente después de encontrar la pareja de código e identificador. La respuesta mantiene una única incidencia y añade `estados_expedientes`, con una entrada por expediente ordenada por id. El frontend valida esa lista y añade «Estado» a los 21 campos visibles, con todos los textos distintos, «Sin expediente» para listas vacías y «No informado» para estados nulos o vacíos.

Se contrastan columnas, claves e índices con MySQL 5.7.21 y el DDL de referencia: `id_incidencia` tiene FK hacia `crm_incidencia.id` y un índice no único. El recuento agregado de la copia local no encontró incidencias con varios expedientes; el código contempla esa cardinalidad sin elegir un estado prioritario. El estado se conserva tal como existe en el CRM, sin imponer los valores de la propuesta anterior ni inicializar filas.

| Comprobación ejecutada | Resultado |
| --- | --- |
| Metadatos y cardinalidad local de `crm_expediente` | Cuatro columnas verificadas, `estado` varchar(20) nullable, FK e índice no único confirmados; ningún caso múltiple en el recuento agregado |
| `docker compose exec -T backend npm run typecheck` | Correcto |
| `docker compose exec -T backend npm test` | Compilación NestJS y 44 pruebas correctas, incluidos ausencia, varios estados, nulos, repetidos y error al leer expedientes |
| SQL del repositorio sobre fuentes derivadas sintéticas en MySQL | Doce casos correctos: filtros de acceso, línea, estados, orden por id, exclusión de expedientes de otra incidencia y ausencia de lectura de expedientes sin coincidencia; ninguna escritura |
| `docker compose exec -T frontend npm run typecheck` | Correcto |
| `docker compose exec -T frontend npm run lint` | Sin errores; permanece la advertencia previa de `postcss.config.mjs` |
| Edge headless con respuestas sintéticas, escritorio y móvil | Correcto: estado visible, ausencia de expediente, nulos, vacíos, varios estados y repetidos; HTML tratado como texto, contrato incorrecto rechazado y ausencia de desbordamiento horizontal |
| `docker compose exec -T frontend npm run test:smoke` | Correcto después de reiniciar únicamente el backend para cargar la compilación nueva |

La comprobación adicional de una incidencia real con el repositorio no fue autorizada y no se ejecutó; no se afirma una verificación positiva del resultado con registros reales. Las pruebas funcionales emplean datos sintéticos y la inspección local solo devuelve metadatos y contadores. La prueba de humo conserva su efecto documentado de crear un log sintético. No se modifica el esquema, los estados, las incidencias, los expedientes, las vistas, las concesiones ni las dependencias. No se repiten compilación del frontend ni construcción de imágenes de producción; los avisos de dependencias anteriores siguen pendientes.

## Estructura del formulario de queja — 29 de octubre de 2026

La rama `feat/formulario-nueva-queja` parte de `develop`. Añade `/quejas/nueva`, su enlace en la cabecera, los 15 campos solicitados y seis obligatorios. El envío permanece deshabilitado y se cancela el evento de submit; no se incorpora un endpoint de alta. La única carga de datos nueva es `GET /api/lineas`, que devuelve id y nombre del catálogo existente. El valor del desplegable es `id_linea_amb`, nombre real contrastado con los metadatos locales; la etiqueta es `nom_linea_tusgsal`.

| Comprobación ejecutada | Resultado |
| --- | --- |
| Metadatos locales de MySQL 5.7.21 | Clave primaria `id_linea_amb` y nombre `varchar(5)` nullable con `utf8_general_ci` confirmados; sin cambios de esquema |
| `docker compose exec -T backend npm run typecheck` | Correcto |
| `docker compose exec -T backend npm test` | Compilación NestJS y 49 pruebas correctas; cinco nuevas para catálogo, nombres repetidos, lista vacía, error público y ausencia de POST |
| SQL del repositorio sobre fuentes derivadas sintéticas en MySQL | Tres casos correctos: filtrado de nombres nulos/vacíos, orden, conservación de ids y nombres repetidos; ninguna escritura |
| `docker compose exec -T frontend npm run typecheck` | Correcto |
| `docker compose exec -T frontend npm run lint` | Sin errores; permanece la advertencia previa de `postcss.config.mjs` |
| Edge headless con catálogo sintético, escritorio y móvil | Correcto: navegación, 15 campos, seis obligatorios, fecha `dd-mm-aaaa`, hora `hh:mm`, código postal con cero inicial y valor de línea por id |
| Prevención de envío y errores del catálogo en navegador | Cero POST al pulsar Enter y usar `requestSubmit`; sin almacenamiento web; catálogo vacío, 503, fallo de red y cinco contratos incorrectos controlados |
| Capturas locales de escritorio y móvil | Revisadas visualmente, sin desbordamiento horizontal |
| `docker compose exec -T frontend npm run test:smoke` | Correcto: nueva página, catálogo real local mediante el proxy y comprobaciones existentes de consulta |

Se reinició únicamente el backend tras compilar las pruebas. El primer smoke durante su arranque respondió 500 en `/api/health`; al terminar el inicio se repitió con éxito. El smoke conserva su log sintético habitual y no envía quejas. Los ensayos de SQL y navegador usan datos sintéticos; no se guardan registros del catálogo en la documentación. No se modifican tablas, permisos ni dependencias. Quedan fuera de esta fase el guardado y las reglas de creación de quejas. No se ejecutan la compilación de producción del frontend ni la construcción de imágenes; continúan pendientes los avisos de dependencias históricos.
