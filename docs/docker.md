# Docker: desarrollo y modo compilado

## Requisitos

Docker Engine / Docker Desktop con contenedores Linux y Docker Compose v2. Comprueba:

```bash
docker version
docker compose version
```

Las imágenes utilizan la rama Node.js 24 sobre Debian slim. No se fuerza `platform: linux/amd64`; Docker selecciona la arquitectura que ofrezca la imagen para el equipo.

No hace falta instalar Node.js en el host. El primer arranque requiere red para descargar imágenes y dependencias npm. El desarrollo vuelve a instalar desde el lockfile al iniciar cada contenedor.

## Primera puesta en marcha

Abre una terminal en la raíz del proyecto. En PowerShell:

```powershell
Copy-Item .env.example .env
docker compose config
docker compose up -d --build
docker compose logs -f
```

En Linux/macOS: `cp .env.example .env` para el primer comando. No sobrescribas una configuración existente.

La creación del frontend espera a que el backend pase su `healthcheck`. Durante la descarga e instalación npm, todavía puede no existir ningún servidor escuchando. Consulta los logs, no deduzcas una avería por el estado inicial.

El script de entrada crea `package-lock.json` con `npm install` cuando no existe y usa `npm ci` en posteriores arranques. Los bind mounts permiten conservar los lockfiles en las carpetas del host. Añádelos a Git después de revisarlos.

La plantilla limita las ramas mayores en `package.json`, pero hasta generar los lockfiles dos instalaciones independientes podrían resolver versiones de parche distintas. Las imágenes compiladas exigen lockfiles y fallan deliberadamente cuando faltan.

## Variables

| Variable del archivo .env | Valor predeterminado | Efecto |
| --- | --- | --- |
| COMPOSE_PROJECT_NAME | backoffice | Nombre del proyecto Compose |
| FRONTEND_PORT | 3000 | Puerto de la web en el host |
| BACKEND_PORT | 3001 | Puerto directo de la API en el host, solo desarrollo |

Las aplicaciones reciben explícitamente variables desde Compose. El archivo `.env` raíz se usa para interpolar Compose: no se copia a la imagen ni se publica al navegador.

El backend escucha en `0.0.0.0:3001` y Next.js en `0.0.0.0:3000` dentro de sus contenedores. Los puertos del host están vinculados a `127.0.0.1`.

Después de cambiar los puertos, ejecuta de nuevo `docker compose up -d`. Un simple `restart` no aplica cambios de configuración de Compose.

## Edición y recarga

`./backend` se monta en `/app` del backend y `./frontend` en `/app` del frontend. Los `node_modules` son volúmenes de Docker para no reutilizar binarios de Windows/macOS en Linux.

NestJS usa su watcher y TypeScript con polling. Next.js se ejecuta con `--webpack` y polling para facilitar la detección de cambios a través de Docker Desktop. Si cambias a Turbopack, revisa también la configuración de observación; las opciones de Webpack no se aplican a Turbopack.

Cambios de TypeScript/TSX/CSS normales no requieren reconstruir la imagen. Los cambios de Dockerfile sí:

```bash
docker compose up -d --build
```

## Añadir o actualizar dependencias

Detén el servicio afectado antes de tocar sus dependencias para evitar instalaciones concurrentes. Ejemplo con un paquete real que decidas incorporar, sustituyendo `NOMBRE_PAQUETE`:

```bash
docker compose stop backend
docker compose run --rm --no-deps --entrypoint npm backend install NOMBRE_PAQUETE
docker compose up -d backend
```

El `--entrypoint npm` evita ejecutar primero la instalación automática del entrypoint. Este comando modifica `backend/package.json` y `backend/package-lock.json` en el host.

Si has modificado `package.json` manualmente y el lockfile quedó desajustado, regenera con:

```bash
docker compose stop backend
docker compose run --rm --no-deps --entrypoint npm backend install
docker compose up -d backend
```

Aplica el mismo procedimiento al servicio frontend cuando corresponda. No borres el lockfile para resolver cualquier error.

## Pruebas en desarrollo

Con ambos servicios iniciados:

```bash
docker compose exec backend npm run typecheck
docker compose exec backend npm test
docker compose exec frontend npm run typecheck
docker compose exec frontend npm run lint
docker compose exec frontend npm run test:smoke
```

`test:smoke` se ejecuta dentro del frontend y prueba `/health`, `/api/health`, `/api` y la página inicial. No es una prueba automatizada con navegador real.

Para inspeccionar dependencias instaladas:

```bash
docker compose exec backend npm ls --depth=0
docker compose exec frontend npm ls --depth=0
docker compose exec backend npm audit
docker compose exec frontend npm audit
```

## Modo compilado

**No mezcles los dos Compose mediante dos argumentos `-f`.** El segundo archivo es completo e independiente, no un override. Primero termina el modo desarrollo; no elimina volúmenes:

```bash
docker compose down
```

Comprueba que existen `backend/package-lock.json` y `frontend/package-lock.json`. Si aún no has arrancado desarrollo, puedes generarlos sin iniciar servidores:

```bash
docker compose build backend frontend
docker compose run --rm --no-deps --entrypoint npm backend install
docker compose run --rm --no-deps --entrypoint npm frontend install
```

Revisa y versiona esos lockfiles. Después:

```bash
docker compose -f docker-compose.prod.yml build --pull
docker compose -f docker-compose.prod.yml up -d
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f
```

Las imágenes compiladas instalan dependencias durante el build; no necesitan ejecutar npm install al arrancar. El frontend usa `.next/standalone`, junto a `.next/static` y `public`. El backend ejecuta `node dist/main.js`.

El backend no publica un puerto en el host. Accede a su API a través de `http://localhost:3000/api`. Swagger está deshabilitado. El frontend sigue limitado al host, no está expuesto a toda la red.

Prueba mínima en el modo compilado:

```bash
docker compose -f docker-compose.prod.yml exec frontend node -e "fetch('http://127.0.0.1:3000/api/health').then(async r => { if (!r.ok) throw new Error('HTTP '+r.status); const j = await r.json(); if (j.status !== 'ok') throw new Error('API no saludable'); console.log(j); }).catch(e => { console.error(e); process.exit(1); })"
```

Para regresar a desarrollo:

```bash
docker compose -f docker-compose.prod.yml down
docker compose up -d --build
```

## Antes de publicar

Añade un proxy inverso con HTTPS y los controles de acceso de la aplicación. Los nombres «production» de los targets indican compilación optimizada, no una garantía de seguridad ni de disponibilidad empresarial.

No publiques los watchers ni Swagger sin control. Define límites de recursos, monitorización, estrategia de secretos y copia de seguridad de las futuras bases de datos. Fija versiones/digests para una entrega reproducible y establece un proceso para actualizarlos.

## Problemas habituales

### Puerto ocupado

Cambia `FRONTEND_PORT` o `BACKEND_PORT` en `.env`, por ejemplo a 3100 y 3101. Recrea los contenedores con `docker compose up -d`. No es necesario cambiar los puertos internos.

### npm ci indica un desajuste

`package.json` y `package-lock.json` no coinciden. Usa el procedimiento de actualización de dependencias anterior. No fuerces `--legacy-peer-deps` ni borres el lockfile sin investigar.

### Error EACCES en Linux

La imagen ejecuta como usuario `node`, UID/GID 1000. El usuario debe poder escribir en el directorio montado. En Docker Desktop esto suele resolverse con los permisos de compartición. En Linux verifica propietario y permisos antes de modificarlos.

Una opción es generar las carpetas con un usuario de UID 1000; otra es adaptar UID/GID de `node` en el stage base de los Dockerfiles y reconstruir. Si ya existen volúmenes, revisa también su propietario. No uses `chmod 777` como solución genérica y no apliques cambios recursivos a todo el disco.

### Next.js no ve cambios

Comprueba el montaje de `./frontend`, `WATCHPACK_POLLING=true` y el arranque con `--webpack`. Las carpetas de red o sincronizadas pueden producir problemas; usa una carpeta de trabajo local. Reinicia solo frontend para cambios de configuración.

### La web responde pero la API falla

Comprueba `docker compose ps` y `docker compose logs backend`. Desde frontend puedes probar:

```bash
docker compose exec frontend node -e "fetch('http://backend:3001/api/health').then(r => r.text()).then(console.log).catch(e => { console.error(e); process.exit(1); })"
```

No sustituyas `backend` por `localhost` dentro del contenedor frontend.

### Servicio unhealthy

El healthcheck indica un fallo de respuesta, pero Docker no reinicia automáticamente un contenedor solo por estar unhealthy. El modo compilado tiene política de reinicio para la salida del proceso; consulta logs y corrige la causa del fallo.

### Antivirus, proxy o falta de red

El primer arranque descarga paquetes e imágenes. Revisa la salida de npm y la configuración de proxy/certificados de Docker. No desactives la validación TLS como solución permanente.
