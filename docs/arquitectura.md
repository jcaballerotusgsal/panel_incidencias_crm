# Arquitectura

## Dos servicios, no seis

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
    └── Base de datos: todavía no configurada
```

NestJS es el framework de la API y usa el adaptador `@nestjs/platform-express`. Node.js ejecuta el backend y también el servidor Next.js. React construye la interfaz; Tailwind genera estilos durante desarrollo/compilación. No se requiere un contenedor dedicado para Express, React o Tailwind.

## Rutas y comunicación

El navegador solicita `/api/health` al mismo origen que sirve la web. `frontend/next.config.ts` reenvía las peticiones `/api/:path*` al nombre de servicio `backend`, puerto interno 3001. Docker Compose proporciona la resolución de ese nombre dentro de su red.

No escribas `http://backend:3001` en código que se ejecute en el navegador. No escribas `localhost:3001` desde un contenedor esperando alcanzar el otro: cada contenedor tiene su propio localhost.

La dirección interna está fijada en `next.config.ts`. Cambiar el nombre del servicio o su puerto interno requiere actualizar la regla y reconstruir el frontend compilado. Cambiar únicamente `FRONTEND_PORT` o `BACKEND_PORT` en `.env` modifica los puertos del host, no esta red interna.

La regla de proxy no incorpora autenticación. Cualquier endpoint de NestJS situado bajo `/api` puede quedar accesible por Next.js: aplicar guardas y permisos en el backend antes de añadir información sensible.

## Responsabilidades

En el backend, cada dominio de negocio debe tener su módulo, controladores, servicios y DTO. Los controladores gestionan el contrato HTTP; los servicios contienen las reglas de negocio. La capa de acceso a datos se añadirá cuando se decida la base de datos.

En el frontend, `src/app/` contiene rutas y layouts; `src/components/` contiene componentes reutilizables. La pantalla de ejemplo usa un Client Component para comprobar la API con `fetch('/api/health')`.

`/health` en Next.js comprueba la vida del servidor web. `/api/health` comprueba el proceso NestJS. Ninguno comprueba SQL, correo, colas ni otras dependencias externas.

## Almacenamiento y separación del entorno antiguo

Los volúmenes de desarrollo contienen exclusivamente dependencias, compilados o caché:

- `backend_node_modules`
- `backend_dist`
- `frontend_node_modules`
- `frontend_next`

No hay MySQL, SQL Server, Adminer ni otro servicio de persistencia en esta plantilla. No se accede a los volúmenes ni servicios del entorno MOP31 anterior.

## Producción

El modo compilado genera imágenes sin bind mounts del código y las ejecuta como usuario `node`. El frontend usa la salida standalone de Next.js. El backend no publica un puerto en el host en ese modo.

Esto no constituye un backoffice empresarial terminado: faltan autenticación, autorización, HTTPS, gestión de secretos, conexión a datos, observabilidad, copia de seguridad de futuros datos y revisión de seguridad del despliegue.
