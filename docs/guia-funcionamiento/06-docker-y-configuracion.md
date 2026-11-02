# 06 · Docker y configuración

Docker permite ejecutar las aplicaciones y MySQL con sus herramientas dentro de contenedores. Compose describe cómo arrancarlos, qué archivos ven y cómo se comunican. No hace falta instalar Node.js o MySQL globalmente en Windows para usar este entorno.

## Servicios de desarrollo

La configuración está en [docker-compose.yml](../../docker-compose.yml). Los puertos de Windows de esta tabla son los predeterminados y se publican solo en loopback.

| Servicio | Ejecuta | Puerto dentro de Docker | Acceso desde Windows |
| --- | --- | --- | --- |
| `frontend` | Next.js con recarga | 3000 | `http://localhost:3000` |
| `backend` | NestJS con watcher | 3001 | `http://localhost:3001/api`, además del proxy de Next.js |
| `db` | MySQL 5.7.21 | 3306 | `127.0.0.1:3307` para un cliente MySQL |
| `adminer` | Herramienta web de administración local | 8080 | `http://localhost:8082` |

Adminer no es una página del frontend ni el encargado de atender sus consultas. NestJS se conecta directamente a MySQL mediante `mysql2`.

Dentro de la red de Compose, los nombres `backend` y `db` identifican los servicios. Por eso NestJS usa `db:3306`, aunque un cliente instalado en Windows usaría el puerto publicado 3307. `localhost` desde un contenedor se refiere a ese mismo contenedor, no a Windows ni a los demás servicios.

El servicio `db` utiliza la imagen exacta `mysql:5.7.21` y fija `linux/amd64`. Las imágenes Node.js usan la rama 24 sobre Debian slim. Esta configuración no debe confundirse con un servidor de producción del CRM.

## Imagen, contenedor, montaje y volumen

| Concepto | Ejemplo del proyecto |
| --- | --- |
| Imagen | Entorno preparado mediante el Dockerfile del frontend o la imagen MySQL elegida |
| Contenedor | Proceso aislado que ejecuta un servicio a partir de una imagen |
| Bind mount | `./frontend:/app` permite que el contenedor vea los archivos que editas en Windows |
| Volumen | `frontend_node_modules` conserva dependencias Linux; `crm_mysql5721_data` conserva los datos locales |

Los volúmenes `backend_node_modules`, `backend_dist`, `frontend_node_modules` y `frontend_next` separan dependencias y resultados generados del código editado en el host. Los datos de MySQL están en su volumen independiente. Detener un contenedor no elimina esos datos.

Los lockfiles tienen otra función: fijan las versiones de las dependencias y se versionan con Git. No son una caché que deba borrarse para resolver errores.

## De dónde sale la configuración de la base

El archivo `.env` de la raíz aporta valores a Compose. El archivo [.env.example](../../.env.example) muestra qué variables hay que configurar, sin que esta guía reproduzca las credenciales locales.

| Configuración | Cómo llega al proceso |
| --- | --- |
| `MYSQL_DATABASE` | Compose la pasa al backend como `DB_NAME` |
| `MYSQL_USER` | Se pasa al backend como `DB_USER` |
| `MYSQL_PASSWORD` | Se pasa al backend como `DB_PASSWORD` |
| Dirección interna | Compose fija `DB_HOST=db` y `DB_PORT=3306` |
| Contraseña administrativa de MySQL | `MYSQL_ROOT_PASSWORD` se pasa al servicio `db`, no al frontend ni al backend |
| Puertos del host | `FRONTEND_PORT`, `BACKEND_PORT`, `MYSQL_PORT` y `ADMINER_PORT` cambian la publicación en Windows |

No basta con que una variable aparezca en `.env`: el proceso debe recibirla desde la configuración de Compose o del entorno. `DatabaseService` lee `process.env.DB_*`, no un archivo del navegador. No se usan variables `NEXT_PUBLIC_*` para credenciales.

Las variables iniciales de MySQL pueden preparar una base local vacía al inicializar un volumen nuevo; no importan el esquema del CRM. Cambiar una contraseña en `.env` tampoco reconfigura por sí solo los usuarios de un volumen MySQL ya inicializado.

## Qué ocurre al arrancar y al editar

1. Compose arranca `db` y su comprobación de salud ejecuta `SELECT 1` con la cuenta local.
2. Cuando `db` está saludable, puede iniciar el backend. Su entrypoint instala con `npm ci` si existe lockfile y ejecuta `npm run start:dev`.
3. El frontend espera al healthcheck del backend. Su entrypoint instala dependencias y ejecuta `npm run dev`.
4. Los montajes permiten que los watchers detecten los archivos que editas. NestJS recompila y Next.js usa Webpack con polling para Docker Desktop.

Hay un entrypoint en [backend/docker/](../../backend/docker/dev-entrypoint.sh) y otro en [frontend/docker/](../../frontend/docker/dev-entrypoint.sh). Al reiniciar un contenedor de desarrollo vuelven a instalar desde el lockfile, por lo que un reinicio puede tardar. No deben hacerse instalaciones concurrentes en el mismo volumen de dependencias.

`depends_on` ordena el inicio según estas comprobaciones. No demuestra que existan todas las tablas ni que NestJS pueda ejecutar la consulta y el INSERT del log. Tampoco sustituye a la gestión de errores mientras la aplicación está funcionando.

## Comandos habituales y su significado

Ejecuta estos comandos desde la raíz cuando necesites la operación indicada; no son pasos que esta guía haya ejecutado automáticamente.

```powershell
docker compose ps
docker compose logs --tail 50 backend
docker compose logs --tail 50 frontend
```

El primero muestra el estado de los servicios. Los otros ayudan a ver compilación, arranque y errores. `docker compose config --quiet` comprueba la configuración sin imprimir su contenido interpolado, que puede incluir credenciales.

Para arrancar y construir lo necesario se utiliza `docker compose up -d --build`. `docker compose stop` detiene los contenedores y `docker compose start` los reanuda. `docker compose down` elimina contenedores y red del proyecto, conservando los volúmenes si no se pide eliminarlos. No uses `down -v` como rutina: eliminaría también los datos locales persistidos.

Cambiar código montado suele bastar para la recarga. Cambiar un Dockerfile requiere reconstruir; cambiar variables o puertos de Compose requiere recrear con `up -d`. Los procedimientos completos y las instrucciones para dependencias están en [docker.md](../docker.md).

## Desarrollo frente al modo compilado

Los Dockerfiles de [backend](../../backend/Dockerfile) y [frontend](../../frontend/Dockerfile) tienen varias etapas. En desarrollo reciben el código por montaje y mantienen watchers. En el modo compilado usan `npm ci`, compilan y copian lo necesario a la imagen final, ejecutada con el usuario `node`.

El backend ejecuta `node dist/main.js`; el frontend usa la salida `standalone` de Next.js con `node server.js`. [docker-compose.prod.yml](../../docker-compose.prod.yml) es una configuración independiente: no se combina con el Compose de desarrollo como si fuera un override.

Ese archivo deshabilita Swagger y no publica el puerto del backend en Windows. **No configura MySQL ni las variables `DB_*`**: los procesos pueden responder a salud, pero la consulta devolverá 503 sin una conexión configurada. Tampoco establece autenticación general ni HTTPS. Se llama modo compilado por cómo prepara y ejecuta el código; no significa que ya exista un despliegue de producción terminado.

[← Base de datos y logs](05-base-de-datos-y-logs.md) · [Siguiente: pruebas y lectura del código →](07-pruebas-y-lectura-del-codigo.md)
