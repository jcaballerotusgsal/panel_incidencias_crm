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
