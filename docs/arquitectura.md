# Arquitectura

## Aplicaciones y servicios locales

```text
Navegador
    │ localhost:3000
    ▼
frontend:3000
    Next.js + React + Tailwind
    │ /api/* → rewrite interno
    ▼
backend:3001
    Node.js + NestJS + Express
    │
    └── db:3306 · MySQL 5.7.21 · copia local del CRM
```

NestJS es el framework de la API y usa el adaptador `@nestjs/platform-express`. Node.js ejecuta el backend y también el servidor Next.js. React construye la interfaz; Tailwind genera estilos durante desarrollo/compilación. No se requiere un contenedor dedicado para Express, React o Tailwind. El Compose de desarrollo incluye además MySQL 5.7.21 y Adminer como herramienta local de administración.

## Rutas y comunicación

El navegador solicita `/api/health` al mismo origen que sirve la web. `frontend/next.config.ts` reenvía las peticiones `/api/:path*` al nombre de servicio `backend`, puerto interno 3001. Docker Compose proporciona la resolución de ese nombre dentro de su red.

No escribas `http://backend:3001` en código que se ejecute en el navegador. No escribas `localhost:3001` desde un contenedor esperando alcanzar el otro: cada contenedor tiene su propio localhost.

La dirección interna está fijada en `next.config.ts`. Cambiar el nombre del servicio o su puerto interno requiere actualizar la regla y reconstruir el frontend compilado. Cambiar únicamente `FRONTEND_PORT` o `BACKEND_PORT` en `.env` modifica los puertos del host, no esta red interna.

La regla de proxy no incorpora autenticación. Cualquier endpoint de NestJS situado bajo `/api` puede quedar accesible por Next.js: aplicar guardas y permisos en el backend antes de añadir información sensible.

## Responsabilidades

En el backend, cada dominio de negocio tiene su módulo, controladores, servicios y DTO. `IncidenciasModule` valida la entrada y exige código e identificador antes de devolver una fila; el repositorio enumera las columnas y parametriza la consulta. Un `LEFT JOIN` por `crm_incidencia.m_linea = crm_lineas_tusgsal_amb.id_linea_amb` añade `nom_linea_tusgsal`, con cardinalidad máxima de una correspondencia por la clave primaria del catálogo. `IncidenciasService` captura el instante de inicio y espera a que `LogsConsultasRepository` guarde el intento en `crm_logs_consulta_incidencias`, tanto con coincidencia como sin ella o ante un error de lectura. Un fallo de registro responde 503. `DatabaseModule` mantiene un pool `mysql2` con credenciales `DB_*`, lecturas e inserciones parametrizadas, tiempos de espera y cierre de conexiones. No crea objetos ni ejecuta migraciones.

Después de encontrar la pareja de datos, el repositorio lee `crm_expediente.estado` mediante su FK `id_incidencia` y devuelve `estados_expedientes`, ordenados por id de expediente. Se conserva una única incidencia con una lista de estados, aunque tenga varios expedientes; sin ellos la lista está vacía. Esta segunda lectura no se ejecuta si no coincide la pareja. Solo se devuelve el estado de los expedientes.

En el frontend, `src/app/` contiene rutas y layouts; `src/components/` contiene componentes reutilizables. El formulario de inicio envía código e identificador a `POST /api/incidencias/consulta`, verifica el contrato JSON y navega a `/incidencias/resultado`. La ficha muestra 21 campos mediante una lista explícita de presentación: código, detalle, información de la incidencia, contacto, acontecimiento y fechas del registro. «Línea» presenta `nom_linea_tusgsal` en lugar del id; «Estado» muestra los estados distintos de los expedientes y «Sin expediente» cuando no los hay. Los ocho campos excluidos se documentan en [reglas-negocio.md](base-de-datos/reglas-negocio.md); la respuesta API conserva las 28 columnas originales y añade el nombre de línea y la lista de estados (30 propiedades). El frontend comprueba que solo esta lista admite elementos de texto o null. La presentación usa etiquetas legibles, fechas sin conversión de zona horaria y «No informado» para valores ausentes. Un contexto de React conserva el resultado solo en memoria, sin datos en la URL, cookies ni almacenamiento persistente. Recargar exige consultar de nuevo. El componente de ejemplo `ApiStatus` se conserva, aunque no se muestra en la página inicial.

`/health` en Next.js comprueba la vida del servidor web. `/api/health` comprueba el proceso NestJS. Ninguno comprueba SQL, correo, colas ni otras dependencias externas.

## Almacenamiento y separación del entorno antiguo

Los volúmenes de las aplicaciones contienen dependencias, compilados o caché:

- `backend_node_modules`
- `backend_dist`
- `frontend_node_modules`
- `frontend_next`

El volumen independiente `crm_mysql5721_data` conserva la copia local del CRM en MySQL 5.7.21. La incorporación de la consulta no importa datos, modifica objetos ni accede al entorno PHP original. La procedencia y los límites de la revisión están en [base-de-datos/README.md](base-de-datos/README.md).

La ampliación de logs añade una tabla creada manualmente en esa copia local y escritura exclusiva de intentos en ella. El frontend conserva el texto de los campos; la búsqueda utiliza el código numérico y el identificador recortado, mientras que el log conserva las entradas recibidas. Las incidencias, el catálogo y el esquema original de referencia mantienen su estructura.

## Producción

El modo compilado genera imágenes sin bind mounts del código y las ejecuta como usuario `node`. El frontend usa la salida standalone de Next.js. El backend no publica un puerto en el host en ese modo.

El Compose compilado no configura una base de datos: conserva liveness y devuelve 503 al consultar incidencias sin `DB_*`. No se ha añadido conexión a producción. Antes de desplegar deben definirse autenticación, permisos del CRM, HTTPS, gestión de secretos, observabilidad, copias de seguridad y revisión de seguridad; el criterio provisional de código e identificador no sustituye esos controles.
