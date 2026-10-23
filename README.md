# Backoffice · NestJS + Next.js + Docker

Módulo de consulta del CRM con aplicaciones separadas del entorno PHP original y una copia local de su base de datos.

| Capa | Tecnología seleccionada |
| --- | --- |
| Ejecución | Node.js 24, imagen `node:24-bookworm-slim` |
| API | NestJS 11, adaptador Express, TypeScript 5.9 |
| Interfaz | Next.js 16, React 19, TypeScript 5.9 |
| Estilos | Tailwind CSS 4 y PostCSS |
| Datos locales | MySQL 5.7.21 y controlador mysql2 en NestJS |
| Orquestación | Docker Compose v2 con contenedores Linux |

Estas son las ramas elegidas para la plantilla, no una afirmación de que todas sean la última versión mayor disponible. Las versiones concretas se resuelven en la primera instalación y quedan registradas en los archivos `package-lock.json`.

**Alcance:** formulario de consulta por código y DNI, correo o código AMB, API NestJS de lectura y ficha de resultados con 20 campos visibles organizados en secciones. El criterio de acceso exige que coincidan ambos datos. Incluye Swagger en desarrollo, recarga y configuración de compilación; quedan por definir la autenticación del CRM, permisos generales, HTTPS y despliegue público.

## 1. Arrancar en Windows / PowerShell

Abre Docker Desktop usando contenedores Linux y abre PowerShell en la carpeta que contiene este README:

```powershell
Copy-Item .env.example .env
# Completa las variables MYSQL_* de .env con la configuración local antes de continuar.
docker compose up -d --build
docker compose logs -f
```

No sobrescribas `.env` si ya lo has configurado. Docker y los contenedores necesitan acceso a Docker Hub y al registro npm durante el primer arranque. No hace falta instalar Node.js ni npm en Windows para ejecutar estos comandos.

En Linux/macOS, cambia el primer comando por `cp .env.example .env`.

La primera puesta en marcha instala las dependencias **dentro de los contenedores** y genera:

```text
backend/package-lock.json
frontend/package-lock.json
```

Después, el script usa `npm ci` para respetar esos lockfiles, que forman parte del proyecto. Revisa las versiones y las pruebas al actualizar dependencias y conserva manifiesto y lockfile juntos.

Cada nuevo inicio del contenedor de desarrollo vuelve a ejecutar la instalación con el lockfile. Los cambios normales de código se recargan sin reiniciar todo el entorno.

## 2. Abrir la aplicación

| Acceso | Dirección predeterminada |
| --- | --- |
| Backoffice | `http://localhost:3000` |
| Salud de la API a través de Next.js | `http://localhost:3000/api/health` |
| API directa, solo en desarrollo | `http://localhost:3001/api` |
| Documentación Swagger, solo en desarrollo | `http://localhost:3001/api/docs` |
| Salud del servidor Next.js | `http://localhost:3000/health` |

La pantalla inicial envía código e identificador a `POST /api/incidencias/consulta` y navega a `/incidencias/resultado`. Devuelve la fila de `crm_incidencia` que coincide o «No se han encontrado los datos». La tabla tiene nombre singular en el esquema local verificado. El resultado solo se conserva en memoria: recargar la página exige consultar de nuevo.

El servicio MySQL debe contener una copia local autorizada del CRM; no se importa ni modifica automáticamente. La configuración y procedencia se describen en [docs/base-de-datos/README.md](docs/base-de-datos/README.md). `/api/health` comprueba únicamente el proceso NestJS y declara `database: "not-checked"`.

## 3. Código que debes editar

```text
backoffice-docker/
├── docker-compose.yml          # Desarrollo y recarga
├── docker-compose.prod.yml     # Modo compilado, configuración independiente
├── .env.example
├── AGENTS.md
├── docs/
├── .local/                     # Notas de trabajo; excluidas de Git
├── backend/
│   ├── Dockerfile
│   ├── package.json
│   ├── docker/dev-entrypoint.sh
│   ├── src/
│   │   ├── main.ts
│   │   ├── app.module.ts
│   │   ├── database/
│   │   ├── incidencias/
│   │   └── health/
│   └── test/
└── frontend/
    ├── Dockerfile
    ├── package.json
    ├── next.config.ts
    ├── postcss.config.mjs
    ├── docker/dev-entrypoint.sh
    ├── src/
    │   ├── app/page.tsx
    │   ├── app/incidencias/resultado/page.tsx
    │   ├── app/globals.css
    │   └── components/consulta-incidencia-form.tsx
    └── scripts/smoke.mjs
```

Edita `frontend/src/app/page.tsx` para cambiar la pantalla inicial y `backend/src/` para añadir la lógica de la API. NestJS usa Express como adaptador; no hay que iniciar otro servidor Express separado. React y Tailwind forman parte del frontend, no son contenedores adicionales.

## 4. Comprobaciones

Cuando los dos servicios estén iniciados:

```bash
docker compose ps
docker compose exec backend npm run typecheck
docker compose exec backend npm test
docker compose exec frontend npm run typecheck
docker compose exec frontend npm run lint
docker compose exec frontend npm run test:smoke
```

El test HTTP del backend arranca una instancia de prueba en un puerto libre. `npm test` recompila la API; durante desarrollo el watcher puede reiniciarla al detectar esa compilación.

Para comprobar las versiones instaladas:

```bash
docker compose exec backend node --version
docker compose exec backend npm ls @nestjs/core @nestjs/platform-express express
docker compose exec frontend npm ls next react react-dom tailwindcss
```

Revisa también `npm audit` en cada servicio. No ejecutes correcciones con `--force` sin revisar los cambios.

## 5. Detener y reanudar

```bash
docker compose stop
docker compose start
```

Para eliminar los contenedores y la red del proyecto, conservando los volúmenes:

```bash
docker compose down
```

**No uses `down -v` ni limpiezas globales de Docker de forma rutinaria.** Esta plantilla no necesita eliminar datos del proyecto PHP/MySQL ni sus volúmenes.

## 6. Modo compilado

Consulta [docs/docker.md](docs/docker.md). Requiere los dos lockfiles y no se combina con el Compose de desarrollo. Añade autenticación, autorización y un proxy HTTPS antes de publicar una aplicación real.

## Documentación y validación

Empieza por [docs/README.md](docs/README.md). Las revisiones iniciales y las comprobaciones posteriores de la consulta local se recogen por separado en [docs/validacion.md](docs/validacion.md).
