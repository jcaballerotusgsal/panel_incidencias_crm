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

## Guía didáctica de funcionamiento — 29 de octubre de 2026

La rama `chore/guia-funcionamiento-app` parte de `develop` en `bf825c8`. Se añade [guia-funcionamiento/README.md](guia-funcionamiento/README.md), con un índice y ocho capítulos sobre visión general, frontend, backend, recorrido HTTP, datos y logs, Docker, pruebas y el formulario de queja pendiente de integrar. Los capítulos enlazan al código leído en esa base y separan la consulta integrada del trabajo de quejas preparado en otra rama.

Se revisan las rutas, DTO, servicio, SQL, registro de intentos, contexto de React, comprobación del JSON, presentación, scripts y configuración de contenedores. Se actualizan el índice de documentación y la introducción del README principal, corrigiendo el número de campos visibles a 21 e indicando el registro de consultas.

| Comprobación ejecutada | Resultado |
| --- | --- |
| Lectura contrastada con código y documentación de `develop` | Recorridos, nombres de archivos, contratos y alcance descritos sin ejecutar consultas de datos |
| Verificación local de enlaces de la guía y ambos índices | 127 enlaces relativos existentes, incluidos archivos de código y documentación |
| Estructura de los nueve archivos de la guía | Índice y ocho capítulos; bloques de código cerrados, sin caracteres de sustitución UTF-8 |

El cambio es documental. No se ejecutan Docker, npm, pruebas HTTP, smoke ni navegador durante esta tarea; no se afirma una nueva validación funcional de la aplicación. No se consultan datos reales, se modifican tablas o se actualizan dependencias. Las comprobaciones funcionales anteriores conservan su fecha y su alcance; las compilaciones y los avisos pendientes no se dan por resueltos con esta guía.

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

## Alta funcional de quejas — 30 de octubre de 2026

Antes de modificar la aplicación se crea `27735fb`, `maquetacion formulario nueva queja`, como punto de guardado solicitado sobre el formulario ya versionado en `4f7dee6`. Se mantiene `feat/formulario-nueva-queja`. El alta añade `POST /api/quejas`, DTO, servicio y repositorio, y una operación transaccional en `DatabaseService`. Valida la línea dentro de esa transacción, inserta incidencia, respuesta y expediente en orden y espera COMMIT antes de devolver código y estado.

Se contrastan metadatos y DDL: MySQL 5.7.21, InnoDB, columnas y relaciones verificadas, ningún trigger en las tablas del alta y permisos existentes de SELECT/INSERT. Se conservan los nombres reales `crm_incidencia`, `dp_correoPostal`, las fechas `*_created_date`/`*_date_updated` y `estado2`. El usuario confirma Dirección + CP como `dirección Cp: código postal`, Lugar sin guardar, Motivo en `m_detalle` y `m_zona` NULL. El idioma se guarda vacío, `dp_sexo` NULL y las constantes restantes siguen [altas-quejas.md](base-de-datos/altas-quejas.md).

| Comprobación ejecutada | Resultado |
| --- | --- |
| Metadatos y permisos de la copia local | Tablas InnoDB y FKs de incidencia/respuesta/expediente confirmadas; sin cambios de esquema, usuarios o concesiones |
| `docker compose exec -T backend npm run typecheck` | Correcto |
| `docker compose exec -T backend npm test` | Compilación NestJS y 133 pruebas correctas: alta, DTO, fechas, Swagger, orden e ids, parámetros, confirmación, rollback y errores públicos; incluye las pruebas existentes |
| SQL real del repositorio y servicio en MySQL | Tres casos sintéticos correctos: alta completa y fallos antes de respuesta/expediente. Se verifican campos, fechas, claves y ausencia de filas tras revertir; el caso completo también sustituye COMMIT por ROLLBACK para no persistir pruebas |
| `docker compose exec -T frontend npm run typecheck` | Correcto |
| `docker compose exec -T frontend npm run lint` | Sin errores; permanece la advertencia previa de `postcss.config.mjs` |
| Edge headless con respuestas sintéticas, escritorio y móvil | JSON de 15 campos, seis obligatorios, id numérico, un único envío simultáneo, Enter, confirmación y nuevo formulario vacío; sin almacenamiento web ni desbordamiento horizontal |
| Errores de envío en navegador | 400, 503, fallo de red, 200 inesperado y confirmaciones 201 incorrectas no muestran éxito; conservan los campos y permiten corregir o reintentar manualmente |
| Capturas locales | Confirmación revisada visualmente en escritorio y móvil |
| `docker compose exec -T frontend npm run test:smoke` | Correcto tras reiniciar solo el backend; incluye POST inválido del alta (400 sin crear filas) y el log sintético habitual de la consulta 404 |
| Enlaces de documentos de entrada, API, formulario, arquitectura y alta | 26 destinos relativos existentes; bloques de código cerrados y sin caracteres de sustitución |

No se ejecuta un alta persistente de usuario por la API local: las pruebas HTTP y de navegador simulan el acceso a datos o las respuestas, y la prueba SQL real revierte todas las filas sintéticas. Las secuencias autoincrementales pueden avanzar aun con rollback; no se resetean. No se leen datos personales reales ni se modifican registros existentes. El único registro persistido por estas comprobaciones es el log sintético documentado del smoke.

La recepción del alta usa un único instante del servidor expresado en Europe/Madrid, incluidos los cambios de horario; los logs de consulta mantienen UTC. No se añade envío de correo, idempotencia entre reintentos, autenticación general ni acceso a producción. No cambian dependencias, lockfiles ni estructura de las tablas. No se ejecutan la compilación de producción del frontend ni la construcción de imágenes; los avisos de dependencias anteriores siguen pendientes.

## Formulario de queja v2 — 30 de octubre de 2026

Primero se guarda la versión funcional anterior en `0a8d018`, `feat: guardar v1 del formulario de nueva queja`, en `feat/formulario-nueva-queja`. Después se incorpora `GET /api/poblaciones`, el desplegable opcional y su validación transaccional, el prefijo de Lugar en el detalle y un selector de calendario nativo. La v2 tiene 16 campos y conserva los seis obligatorios y el contrato de fecha `dd-mm-aaaa` del POST.

Los metadatos de MySQL 5.7.21 confirman `crm_m_zona_poblaciones` como InnoDB, `id_m_zona int(11)` PK y `poblacion varchar(45)` nullable con `utf8_general_ci`; también la FK ya existente desde `crm_incidencia.m_zona`. No se cambian objetos ni concesiones. El catálogo devuelve solo id y nombre. El alta guarda el id seleccionado, o NULL sin población, y comprueba esa opción antes de insertar. El formato inicial del detalle era `[Lugar proporcionado por el usuario:(LUGAR) ] (Motivo)`, omitiendo componentes ausentes. Su revisión posterior sin paréntesis se documenta al final; la especificación vigente está en [altas-quejas.md](base-de-datos/altas-quejas.md).

| Comprobación ejecutada | Resultado |
| --- | --- |
| `docker compose exec -T backend npm run typecheck` | Correcto |
| `docker compose exec -T backend npm test` | Compilación NestJS y 158 pruebas correctas: catálogo, id opcional/cero, población inválida, rollback, formato de Lugar y compatibilidad con la v1 |
| `docker compose exec -T frontend npm run typecheck` | Correcto |
| `docker compose exec -T frontend npm run lint` | Sin errores; permanece la advertencia previa de `postcss.config.mjs` |
| SQL del catálogo sobre fuentes derivadas sintéticas | Tres casos correctos: filtro de nombres nulos/vacíos, orden, ids y nombres repetidos; sin escrituras |
| Servicio y SQL real del alta con datos sintéticos | Cinco casos correctos: sin población, con población, fallos de respuesta/expediente y población inexistente; verifica FK, id y prefijo de Lugar. Todo revertido, incluso el caso completo, sin filas persistidas |
| Edge headless con API simulada | 16 campos, seis obligatorios, nombre visible e id numérico de población, zona null si se omite, protección de envíos simultáneos y reinicio del formulario |
| Calendario en navegador | Input nativo `date`; valor HTML convertido sin desfases al POST, con 29 de febrero y fechas próximas a cambios de horario; año inferior a 1000 impide el envío |
| Catálogo opcional en navegador | Vacío, 503, error de red y respuestas inválidas controlados; permite enviar sin población, sin opciones inventadas |
| Capturas de escritorio y móvil | Revisadas visualmente: población y selector de fecha, sin desbordamiento horizontal |
| `docker compose exec -T frontend npm run test:smoke` | Correcto: catálogos reales mediante Next.js, calendario, 16 campos, 400 de alta y comprobaciones previas. Conserva únicamente su log sintético habitual de consulta 404 |
| Enlaces de documentos de entrada, API, formulario, arquitectura y alta | 26 destinos relativos existentes y bloques de código cerrados |

Se reinicia solo el backend después de compilar las pruebas. Las pruebas de navegador simulan la creación y las de SQL real revierten las filas sintéticas; no se ejecuta un alta persistente de usuario por la API local, no se leen datos personales reales ni se actualizan registros anteriores. Los autoincrementales pueden avanzar con rollback, sin resetearse. No se añaden dependencias ni se modifican lockfiles, puertos, imágenes o esquema. No se ejecutan compilación de producción del frontend ni construcción de imágenes; los pendientes de despliegue y dependencias anteriores conservan su alcance.

## Revisión del detalle antes del commit de v2 — 30 de octubre de 2026

El usuario modifica el servicio para usar `[Lugar proporcionado por el usuario: LUGAR] Motivo`, sin añadir paréntesis alrededor de Lugar o Motivo. Se conserva ese cambio y se ajustan las expectativas de las pruebas y la documentación, incluidos el espacio después de los dos puntos y la ausencia de espacio antes del corchete de cierre. Se mantienen el texto literal, los saltos de línea y las reglas para componentes ausentes. Los registros ya guardados no se reescriben.

Antes del commit se ejecutan de nuevo los tipos del backend y frontend, la compilación NestJS y las 158 pruebas del backend: todo correcto. El lint del frontend termina sin errores y con la advertencia previa de `postcss.config.mjs`. Tras reiniciar solo el backend, pasan la comprobación de salud mediante Next.js y `npm run test:smoke`, que conserva únicamente su log sintético habitual de consulta 404 y no crea quejas. No se repiten las pruebas de navegador ni de SQL real y no se ejecutan compilación de producción del frontend ni construcción de imágenes.

## Integración del formulario y validación para main — 2 de noviembre de 2026

La integración de `feat/formulario-nueva-queja` (`9c39d25`) en `develop` combina la guía y el formulario funcional. Se resuelven los conflictos documentales de `README.md` y este historial conservando ambas aportaciones. La guía se actualiza para explicar el alta integrada, los catálogos de líneas y poblaciones, el calendario y las tres inserciones transaccionales. El código de backend, frontend y ambos Compose coincide con la rama del formulario; la resolución no cambia su comportamiento.

| Comprobación ejecutada sobre la integración | Resultado |
| --- | --- |
| Tipos del backend y frontend | Correctos |
| Compilación NestJS y `npm test` del backend | 158 pruebas correctas, sin fallos |
| Lint del frontend | Sin errores; conserva la advertencia previa de `postcss.config.mjs` |
| `npm run test:smoke` local a través de Next.js | Correcto: consulta, formularios, calendario, 16 campos y ambos catálogos; solo genera su log sintético habitual de consulta 404 |
| Construcción de las dos imágenes con `docker-compose.prod.yml build --pull` | Correcta, con lockfiles y Node.js 24; incluye el build optimizado y standalone de Next.js 16.4.1 |
| Arranque de ambas imágenes en el proyecto local aislado `backoffice-merge-20261102` | Servicios healthy; frontend publicado únicamente en loopback, puerto 3102, sin combinar los Compose ni detener la base local |
| Smoke sobre las imágenes compiladas | Salud de Next.js/API, proxy, pantallas, 16 campos, calendario, Swagger deshabilitado y validación 400 correctos; catálogos y alta válida responden 503 esperado al no configurar DB |
| Ejecución de las imágenes | Ambos procesos comprobados con Node.js 24, `NODE_ENV=production` y UID 1000; backend sin variables `DB_*` |
| Guía de funcionamiento | 137 enlaces relativos existentes, bloques cerrados y UTF-8 sin caracteres de sustitución |

La primera espera de salud local obtiene 500 mientras el backend reiniciado termina su instalación y arranque; los logs muestran `ECONNREFUSED`. Una vez disponible, la salud directa y mediante el proxy responde 200 y el smoke pasa. No se modifica el frontend para ocultar ese estado transitorio.

La validación compilada usa un proyecto Docker separado y sin conexión al CRM: no crea quejas ni accede a producción. Sus contenedores y red se retiran al terminar, sin borrar volúmenes. La prueba local de desarrollo mantiene únicamente el efecto sintético del smoke documentado. Los avisos de dependencias de npm durante el build siguen pendientes de revisión; no se modifican versiones ni lockfiles automáticamente. Esta comprobación resuelve el pendiente de construcción y arranque compilado de la v2; conserva los límites de autenticación, permisos generales, HTTPS, idempotencia, pruebas de alta persistente y despliegue real.

## Ajuste del código AMB en apellidos — 2 de noviembre de 2026

La rama `fix/ajustes-codigo-apellido` parte de `develop` en `598a542`. La consulta solo habilita la comparación con `dp_apellidos` cuando el identificador recortado empieza por QU, sin distinguir mayúsculas. El repositorio pasa ese permiso como parámetro 0/1 del SQL fijo y conserva la coincidencia completa del identificador y el id de incidencia. DNI y correo no requieren QU. Un apellido sin ese prefijo que no coincida por los otros campos responde 404, registra `Valida = 0` y no lee expedientes. El DTO no rechaza globalmente identificadores sin QU; su descripción Swagger explica la condición.

| Comprobación ejecutada | Resultado |
| --- | --- |
| Tipos del backend y frontend | Correctos |
| Compilación NestJS y pruebas del backend | 168 correctas: diez regresiones nuevas para apellidos sin QU, variantes de mayúsculas, DNI/correo y código o incidencia no coincidentes |
| SQL del repositorio sobre fuentes derivadas sintéticas en MySQL 5.7.21 | 14 casos correctos: prefijo, igualdad completa, id, espacios, intercalación existente, DNI/correo, nulos y parámetros de entrada; ninguna lectura de registros del CRM ni escritura |
| Lint del frontend | Sin errores; permanece la advertencia previa de `postcss.config.mjs` |
| Smoke a través de Next.js | Correcto después de reiniciar el backend y esperar su estado healthy; solo conserva el log sintético habitual de la consulta 404 |
| Guía de funcionamiento | 137 enlaces relativos existentes, bloques cerrados y UTF-8 sin caracteres de sustitución |

Las pruebas HTTP usan el repositorio real con una dependencia de datos simulada; la comprobación adicional ejecuta su SQL en MySQL sobre SELECT sintéticos, conservando las condiciones y las intercalaciones de comparación. No se realiza una consulta positiva con incidencias personales reales. No se cambia el esquema, el contenido histórico, las dependencias, los lockfiles ni el frontend. No se repiten navegador, construcción de imágenes o despliegue; no se ha confirmado ninguna regla adicional del formato AMB aparte del prefijo solicitado.

## Avisos de alta y estado — 4 de noviembre de 2026

La rama `feat/notificaciones-correo-quejas` parte de `develop` en `a36e502`. El alta registra dos avisos en su transacción y un trigger manual registra cambios de `crm_expediente.estado` del CRM PHP. El consumidor independiente permite Microsoft Graph y SMTP, con reservas y reintentos por destinatario. La configuración local conserva el envío desactivado hasta autorizar una aplicación de Microsoft 365.

| Comprobación ejecutada | Resultado |
| --- | --- |
| Tipos del backend | Correctos |
| Compilación NestJS y pruebas del backend | 197 correctas, sin fallos; incluye altas con fallo de cola, reservas, reintentos, token, apagado y proveedor |
| Microsoft Graph simulado, sin acceso externo | Mensajes independientes, token reutilizado/invalidation tras 401, permisos 403, límites 429/Retry-After, fallo 503 y validación de destinatario correctos |
| SMTP real sobre loopback de la prueba | Dos mensajes con destinatarios e identificadores independientes, capturados por un servidor de prueba sin entrega externa |
| Preflight MySQL local | Versión exacta 5.7.21, tablas InnoDB, binlog desactivado, cola y triggers de expediente ausentes antes de instalar |
| Instalación manual de SQL 002 y 003 | Correcta con la cuenta administradora local tras rechazo CREATE de la cuenta de API; sin cambios de permisos, vistas ni columnas originales |
| SQL real de altas y trigger | Cinco escenarios sintéticos: avisos de alta, cambio de estado, estado sin cambios, NULL y ROLLBACK; todas las filas revertidas |
| SQL real de reservas en MySQL 5.7.21 | Orden por incidencia/destinatario, reintento diferido, dirección interna fijada, recuperación de reserva caducada y rechazo de token anterior correctos; todo revertido |
| Tipos y lint del frontend | Tipos correctos, sin errores de lint; conserva la advertencia previa de `postcss.config.mjs` |
| Smoke a través de Next.js tras arrancar/recrear la API | Correcto: consulta, resultado, formulario y catálogos; solo genera el log sintético habitual del 404 |
| Ambos Compose con el perfil notificaciones | `config --quiet` correcto, sin imprimir secretos |
| Imagen de desarrollo y arranque de correo-worker | Construcción correcta y proceso iniciado; logs confirman envío desactivado, sin puerto publicado para el worker |
| Documentación | 218 enlaces relativos existentes y UTF-8 comprobados en 29 documentos |

Se actualizan manifiesto y lockfile con Nodemailer 10.3.1 y sus tipos 8.0.2. Se mantienen Node.js 24, NestJS 11, MySQL 5.7.21 y las versiones del frontend. El consumidor no instala paquetes ni comparte otro watcher; se detiene junto con backend al cambiar dependencias.

No se han enviado correos externos ni se han registrado credenciales/permisos en Microsoft 365. Queda pendiente configurar tenant, aplicación, secreto y autorización del buzón por el administrador, y comprobar un envío real autorizado. No se modifica PHP, no se notifican cambios históricos ni se conservan filas sintéticas de estas pruebas SQL; las secuencias autoincrementales pueden avanzar. No se repiten navegador ni construcción/arranque de imágenes de producción en esta rama. Antes de ampliar el uso siguen pendientes autenticación, despliegue, conservación, monitorización y gestión administrativa de avisos fallidos. La entrega al buzón y la ausencia absoluta de duplicados no están garantizadas por una aceptación del proveedor.

## Preparación de la integración en develop — 6 de noviembre de 2026

Antes de guardar e integrar las notificaciones se repiten tipos de backend/frontend, compilación y las 197 pruebas del backend, lint y smoke a través de Next.js: todo correcto, con la advertencia previa de postcss.config.mjs. Las pruebas no envían correos externos ni crean quejas reales. Se mantiene .env fuera de Git; la comprobación del envío real con Microsoft 365 queda fuera de esta integración.