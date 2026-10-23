# API inicial

Prefijo global en NestJS: `/api`.

| Método | Ruta | Función |
| --- | --- | --- |
| GET | `/api` | Identificación de la API |
| GET | `/api/health` | Liveness del proceso NestJS |
| GET | `/api/docs` | Swagger cuando `ENABLE_SWAGGER=true` |

El frontend reenvía las rutas `/api/*` al backend. La ruta adicional `/health` pertenece al propio Next.js.

## GET /api/health

Ejemplo ilustrativo; la fecha y el tiempo de actividad se calculan en cada llamada:

```json
{
  "status": "ok",
  "service": "backoffice-api",
  "timestamp": "2026-10-14T09:36:00.000Z",
  "uptimeSeconds": 24,
  "database": "not-configured"
}
```

Respuesta: HTTP 200 y `Cache-Control: no-store`.

El campo `database` evita confundir liveness con una comprobación de persistencia. Cuando se conecte una base de datos, añadir una comprobación de disponibilidad real, con timeout, sin publicar credenciales.

## Añadir un módulo

Crea su módulo en `backend/src/`, registra el módulo en `AppModule` y añade controladores, servicios y DTO. Las nuevas rutas bajo `/api` utilizan automáticamente la regla existente del frontend.

Antes de exponer datos reales, implementar autenticación y autorización en NestJS. El código inicial no tiene un usuario autenticado ni permisos implícitos.
