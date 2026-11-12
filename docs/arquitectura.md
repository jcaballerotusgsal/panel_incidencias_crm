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

La consulta limita el uso histórico de `dp_apellidos` como código AMB: solo habilita esa coincidencia si el identificador empieza por `QU`, sin distinguir mayúsculas, después de recortar los extremos. La condición se aplica en el repositorio del backend mediante un parámetro 0/1; no depende de la validación del navegador. DNI y correo mantienen su comparación y siempre se exige el id de incidencia. Un intento por apellidos sin ese prefijo sigue el flujo de consulta no encontrada y su log.

En el backend, cada dominio de negocio tiene su módulo, controladores, servicios y DTO. `IncidenciasModule` valida la entrada y exige código e identificador antes de devolver una fila; el repositorio enumera las columnas y parametriza la consulta. Un `LEFT JOIN` por `crm_incidencia.m_linea = crm_lineas_tusgsal_amb.id_linea_amb` añade `nom_linea_tusgsal`, con cardinalidad máxima de una correspondencia por la clave primaria del catálogo. `IncidenciasService` captura el instante de inicio y espera a que `LogsConsultasRepository` guarde el intento en `crm_logs_consulta_incidencias`, tanto con coincidencia como sin ella o ante un error de lectura. Un fallo de registro responde 503. `DatabaseModule` mantiene un pool `mysql2` con credenciales `DB_*`, lecturas e inserciones parametrizadas, tiempos de espera y cierre de conexiones. No crea objetos ni ejecuta migraciones.

Después de encontrar la pareja de datos, el repositorio lee `crm_expediente.estado` mediante su FK `id_incidencia` y devuelve `estados_expedientes`, ordenados por id de expediente. Se conserva una única incidencia con una lista de estados, aunque tenga varios expedientes; sin ellos la lista está vacía. Esta segunda lectura no se ejecuta si no coincide la pareja. Solo se devuelve el estado de los expedientes.

En el frontend, `src/app/` contiene rutas y layouts; `src/components/` contiene componentes reutilizables. El formulario de inicio envía código e identificador a `POST /api/incidencias/consulta`, verifica el contrato JSON y navega a `/incidencias/resultado`. La ficha muestra 21 campos mediante una lista explícita de presentación: código, detalle, información de la incidencia, contacto, acontecimiento y fechas del registro. «Línea» presenta `nom_linea_tusgsal` en lugar del id; «Estado» muestra los estados distintos de los expedientes y «Sin expediente» cuando no los hay. Los ocho campos excluidos se documentan en [reglas-negocio.md](base-de-datos/reglas-negocio.md); la respuesta API conserva las 28 columnas originales y añade el nombre de línea y la lista de estados (30 propiedades). El frontend comprueba que solo esta lista admite elementos de texto o null. La presentación usa etiquetas legibles, fechas sin conversión de zona horaria y «No informado» para valores ausentes. Un contexto de React conserva el resultado solo en memoria, sin datos en la URL, cookies ni almacenamiento persistente. Recargar exige consultar de nuevo. El componente de ejemplo `ApiStatus` se conserva, aunque no se muestra en la página inicial.

`/health` en Next.js comprueba la vida del servidor web. `/api/health` comprueba el proceso NestJS. Ninguno comprueba SQL, correo, colas ni otras dependencias externas.

La cabecera compartida enlaza la consulta inicial con `/quejas/nueva`, con los 16 campos de la v2 descritos en [formulario-queja.md](formulario-queja.md). `GET /api/lineas` carga id y nombre desde `LineasModule`; `GET /api/poblaciones` hace lo mismo desde `PoblacionesModule`, con el id `id_m_zona`. Ambos catálogos se validan en el frontend y se cargan de forma independiente; población es opcional. El selector de calendario entrega un valor HTML que se transforma al contrato de fecha existente sin conversiones de zona horaria. `POST /api/quejas`, en `QuejasModule`, valida el formulario, comprueba las opciones seleccionadas y crea incidencia, respuesta y expediente mediante una sola conexión y transacción de `DatabaseService`. Guarda el id de población en `m_zona` y antepone Lugar al motivo en `m_detalle`. Recepción y registros comparten un único instante de Europe/Madrid. Se confirma COMMIT antes de devolver código y estado; un fallo intenta ROLLBACK y no entrega confirmación de alta. El formulario evita envíos simultáneos y muestra el código tras validar la respuesta 201. No persiste sus campos en almacenamiento web. El alta registra además dos avisos de correo en la misma transacción; el envío lo realiza un proceso separado después del COMMIT. La correspondencia completa está en [altas-quejas.md](base-de-datos/altas-quejas.md).

## Identidad visual del frontend

`globals.css` define la paleta DIREXIS TUSGSAL con amarillo `#f5a810`, gris `#64666b` y neutros derivados. `@theme inline` expone estos valores a Tailwind 4 y las clases de componentes comparten controles y superficies. `plant.tsx` compone cabecera y pie; `marca-corporativa.tsx` carga el PNG de `public/brand/logo-direxis-tusgsal.png`, conserva una alternativa de texto si falta y marca la navegación activa. La página inicial usa dos columnas en escritorio y apila el formulario en móvil. Títulos y descripción identifican la empresa, sin modificar contratos de datos. Consulta [identidad-corporativa.md](identidad-corporativa.md) para añadir el logo y ajustar colores.

## Almacenamiento y separación del entorno antiguo

Los volúmenes de las aplicaciones contienen dependencias, compilados o caché:

- `backend_node_modules`
- `backend_dist`
- `frontend_node_modules`
- `frontend_next`

El volumen independiente `crm_mysql5721_data` conserva la copia local del CRM en MySQL 5.7.21. La incorporación de la consulta no importa datos, modifica objetos ni accede al entorno PHP original. La procedencia y los límites de la revisión están en [base-de-datos/README.md](base-de-datos/README.md).

La ampliación de logs añade una tabla creada manualmente en esa copia local. La búsqueda utiliza el código numérico y el identificador recortado, mientras que su log conserva las entradas recibidas. El alta autorizada del 30 de octubre escribe también en las tres tablas originales de incidencia, respuesta y expediente, sin alterar su estructura ni ejecutar migraciones. El catálogo sigue siendo de lectura. No se crea un log de consulta al dar de alta una queja.

## Notificaciones de correo

`NotificacionesModule` permite que `QuejasRepository` registre dos avisos de alta en la transacción del CRM. Un trigger manual AFTER UPDATE de `crm_expediente.estado` hace lo mismo para los cambios del CRM PHP. La nueva `crm_notificaciones_correo` conserva eventos y destinatarios; no se cambia la estructura de las tablas originales.

El servicio opcional `correo-worker`, perfil Compose `notificaciones`, inicia un contexto NestJS sin HTTP, reserva avisos mediante MySQL y los envía a Microsoft Graph fuera de la transacción. La API y el frontend no reciben credenciales de Microsoft ni ejecutan consumidores. Hay reintentos por destinatario, reservas recuperables y protección por token; aceptar un envío no equivale a entrega en el buzón. El envío está desactivado hasta configurar la aplicación de Microsoft 365. Véanse [operación y configuración](notificaciones-correo.md) y [tabla y trigger](base-de-datos/notificaciones-correo.md).

La plantilla de correo al usuario está en `backend/src/notificaciones/plantillas/usuario.html`. En desarrollo el consumidor lee ese original por envío; en los demás modos lee la copia que Nest CLI distribuye a `dist/notificaciones/plantillas/`. Sus bloques distinguen alta y cambio de estado. Las variables se escapan sin evaluar código, y una plantilla inválida genera un fallo reintentable antes de llamar al proveedor. Graph usa HTML para el solicitante, SMTP añade una alternativa de texto y el destinatario interno conserva texto plano. Los pasos de edición están en [plantilla-correo-usuario.md](plantilla-correo-usuario.md).

## Producción

El modo compilado genera imágenes sin bind mounts del código y las ejecuta como usuario `node`. El frontend usa la salida standalone de Next.js. El backend no publica un puerto en el host en ese modo.

El Compose compilado no configura una base de datos: conserva liveness y devuelve 503 al consultar incidencias sin `DB_*`. No se ha añadido conexión a producción. Antes de desplegar deben definirse autenticación, permisos del CRM, HTTPS, gestión de secretos, observabilidad, copias de seguridad y revisión de seguridad; el criterio provisional de código e identificador no sustituye esos controles.
