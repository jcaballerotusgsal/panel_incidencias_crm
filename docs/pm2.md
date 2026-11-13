# Ejecución con PM2 sin Docker

La rama `feat/configuracion-pm2` incorpora dos archivos con el nombre estándar `ecosystem.config.js`. Requieren Node.js 24 y PM2 disponible en la cuenta del servidor que administrará la aplicación. No se añade PM2 como dependencia ni se instala globalmente desde el proyecto.

| Archivo | Nombre en PM2 | Entrada | Puerto predeterminado |
| --- | --- | --- | --- |
| `frontend/ecosystem.config.js` | `crm-sac-frontend` | `.next/standalone/server.js` | 3010 |
| `backend/ecosystem.config.js` | `crm-sac-api` | `dist/main.js` | 3011 |
| `backend/ecosystem.config.js` | `crm-sac-correo` | `dist/notificaciones/worker.js` | Sin HTTP |

Todos usan una instancia en modo fork, sin watcher, con reinicio automático y espera de cinco segundos tras un fallo. Se limita el número de arranques inestables para no repetir indefinidamente un error de configuración. `cwd: __dirname` hace que las rutas se resuelvan desde cada aplicación, aunque lances PM2 desde otra carpeta. La API y el consumidor ejecutan JavaScript compilado directamente, sin pasar por `npm.cmd`.

## 1. Variables del servidor

Los comandos siguientes se ejecutan en PowerShell, desde la raíz del repositorio. Crear los archivos solo si todavía no existen:

```powershell
if (-not (Test-Path .\backend\.env)) {
  Copy-Item .\backend\.env.example .\backend\.env
}
if (-not (Test-Path .\frontend\.env.production.local)) {
  Copy-Item .\frontend\.env.example .\frontend\.env.production.local
}
```

Completa `backend/.env` en el servidor con `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER` y `DB_PASSWORD`. Usa el nombre y credenciales del destino autorizado; no se crean bases, tablas ni usuarios. Este archivo no se versiona. Para correo, configura también las variables descritas en [notificaciones-correo.md](notificaciones-correo.md). El ejemplo mantiene `NOTIFICATIONS_ENABLED=false`.

La conexión usa **DB_NAME/DB_USER/DB_PASSWORD**, sin la traducción `MYSQL_*` que hace Compose. No copies automáticamente el `.env` raíz: ese archivo pertenece a Docker y no lo cargan estas configuraciones. Los dos procesos del backend cargan `backend/.env` mediante `node_args: ['--env-file=.env']`; si falta, Node no arranca. Las variables ya presentes en el entorno prevalecen sobre ese archivo, por lo que conviene que la cuenta de PM2 no conserve valores de otra instalación.

En `frontend/.env.production.local`, configura antes de compilar:

```dotenv
API_INTERNAL_URL=http://127.0.0.1:3011
```

Si ya habías creado este archivo con el puerto 3001, actualiza su valor a 3011 antes de repetir el build. Actualizar el ejemplo en Git no modifica tu archivo privado del servidor.

Es la dirección interna de NestJS vista por Next.js, con protocolo y puerto, sin `/api` al final. No es una variable del navegador ni necesita `NEXT_PUBLIC_`. No pongas credenciales de MySQL o Microsoft 365 en el frontend. Sin esta variable, `next.config.ts` conserva `http://backend:3001` para Docker. Cambiarla después de compilar requiere repetir el build: el destino del rewrite queda guardado en la salida standalone.

## 2. Compilar el backend

Desde `backend`:

```powershell
npm ci
npm run build
```

Comprueba que existen `dist/main.js`, `dist/notificaciones/worker.js` y `dist/notificaciones/plantillas/usuario.html`. El mismo build sirve para API y correo. Durante una actualización, detener ambos procesos de PM2 antes de instalar o reemplazar sus dependencias compartidas. Instala y compila con Node.js 24 en el sistema de destino, sin reutilizar `node_modules` de Linux/Docker en Windows.

## 3. Compilar y preparar el frontend

Desde `frontend`, después de completar `.env.production.local`:

```powershell
npm ci
npm run build
Copy-Item -LiteralPath .\public -Destination .\.next\standalone -Recurse -Force
Copy-Item -LiteralPath .\.next\static -Destination .\.next\standalone\.next -Recurse -Force
```

Las copias incorporan el logo, imágenes, CSS y JavaScript al servidor standalone. Hay que repetirlas después de cada build. Esta configuración inicia `server.js`, no `next dev` ni `next start`. Si despliegas copiando artefactos, conserva las rutas relativas: el archivo ecosystem sigue en `frontend/`, con `.next/standalone/` debajo.

## 4. Arrancar desde la raíz

```powershell
pm2 start .\backend\ecosystem.config.js --only crm-sac-api
pm2 start .\frontend\ecosystem.config.js
pm2 list
```

Los archivos fijan `NODE_ENV=production`, así que no necesitan `--env production`. El puerto de la API se cambia en `backend/ecosystem.config.js`, en `env.PORT`; el del frontend, en su `env.PORT`. Si cambia el de la API, actualiza también `API_INTERNAL_URL` y recompila el frontend. Los valores de los ecosystems prevalecen sobre las variables del mismo nombre en el archivo `.env`.

El frontend escucha por defecto en `127.0.0.1:3010`, adecuado si IIS/Nginx está en esa máquina. Para acceso directo por IP, su `env.HOSTNAME` puede cambiarse a `0.0.0.0`, revisando firewall y acceso del servidor. La API escucha en `0.0.0.0:3011` al ejecutarse con este ecosystem: restringir su puerto a los orígenes internos necesarios. Estos archivos no configuran HTTPS ni un proxy público.

Comprobar desde el servidor:

```powershell
Invoke-RestMethod http://127.0.0.1:3011/api/health
Invoke-RestMethod http://127.0.0.1:3010/api/health
pm2 logs crm-sac-api --lines 30
```

Los dos healthchecks solo verifican los procesos y el reenvío; no certifican MySQL ni correo. Para la conexión de datos, utiliza una consulta autorizada del entorno. No es necesario crear una queja para comprobar el arranque.

## 5. Consumidor de correo

Tras configurar las credenciales y revisar qué avisos pendientes se procesarán, activar el envío en `backend/.env` y arrancar:

```powershell
pm2 start .\backend\ecosystem.config.js --only crm-sac-correo
pm2 logs crm-sac-correo --lines 30
```

Ejecutar solo `pm2 start backend/ecosystem.config.js` arranca los dos procesos del backend. El ejemplo desactiva el envío, pero arrancar el consumidor con un `.env` real activado procesa también los pendientes. Mantener un único consumidor por instalación y no dejar simultáneamente el worker Docker y el de PM2 sobre la misma cola durante el cambio de entorno.

En Windows, PM2 puede terminar un proceso sin entregar SIGINT/SIGTERM. Los tiempos `kill_timeout` no garantizan por sí solos un cierre ordenado en ese sistema: no se añade `shutdown_with_message` sin un manejador compatible. Las reservas y posibles duplicados tras una interrupción conservan las reglas documentadas en [notificaciones-correo.md](notificaciones-correo.md). El arranque y la parada deben comprobarse en el servidor de destino.

## Actualizar y guardar la lista de PM2

Después de cambiar solo `backend/.env`, reiniciar los procesos afectados vuelve a leerlo. Después de cambiar el ecosystem, reiniciar usando el archivo para aplicar sus opciones:

```powershell
pm2 restart .\backend\ecosystem.config.js --only crm-sac-api --update-env
pm2 restart .\backend\ecosystem.config.js --only crm-sac-correo --update-env
pm2 restart .\frontend\ecosystem.config.js --update-env
pm2 save
```

Ejecuta el reinicio del consumidor solo si estaba habilitado y lo quieres en ejecución. Un cambio de código exige recompilar antes. `pm2 save` guarda la lista completa de procesos de esa cuenta; no configura por sí solo un servicio de arranque de Windows. La recuperación tras reiniciar el servidor debe integrarse en el mecanismo que ya use vuestro administrador, con la misma cuenta y directorio PM2.

El despliegue bajo `/crm_sac` sigue pendiente: estas configuraciones mantienen las rutas actuales desde `/`. PM2 administra procesos; no añade un prefijo a las rutas de Next.js.

## Referencias

- [PM2: archivos ecosystem, cwd, fork y argumentos de Node](https://pm2.keymetrics.io/docs/usage/application-declaration/).
- [PM2: cierre y particularidades de Windows](https://pm2.keymetrics.io/docs/usage/signals-clean-restart/).
- [Node.js 24: carga y prioridad de archivos de entorno](https://nodejs.org/download/release/v24.0.2/docs/api/cli.html#--env-fileconfig).
- [Next.js: servidor standalone y archivos estáticos](https://nextjs.org/docs/app/api-reference/config/next-config-js/output).
