# Buenas prácticas

## Organización

Mantén los dominios del backend en módulos separados de NestJS. Evita controladores que contengan consultas, reglas de negocio y presentación simultáneamente. Separa componentes de interfaz de clientes API y transformación de datos.

No dupliques un servidor Express junto a NestJS: amplía NestJS o su adaptador cuando haga falta.

## Comentarios

Cada función, método y constructor nuevo o modificado debe explicar su propósito. Añade parámetros, retorno, errores y efectos cuando aporten información; no copies la firma sin contexto.

```ts
/**
 * Devuelve los expedientes visibles para un usuario autorizado.
 * @param userId Identificador del usuario autenticado, obtenido de la sesión.
 * @returns Expedientes que cumplen el ámbito de acceso.
 * @throws ForbiddenException si el usuario no tiene acceso al módulo.
 */
```

Los comentarios de métodos van junto al código. En `docs/` se describe el flujo general, la arquitectura y las decisiones, no una copia manual de cada función. Las callbacks breves pueden documentarse en el bloque al que pertenecen.

## Contratos y errores

Valida las entradas con DTO y `ValidationPipe`. No asumas que los tipos de TypeScript validan un JSON recibido. El componente de salud incluye una comprobación explícita de su contrato como ejemplo.

Usa errores HTTP adecuados y mensajes que no revelen contraseñas, tokens o cadenas de conexión. Aplica timeout y estados de error a llamadas de red. No muestres siempre «conectado» solo porque la página se ha renderizado.

## Seguridad

Los puertos publicados se limitan a loopback por defecto. No expongas el modo desarrollo a Internet. Antes de publicar, añade autenticación, autorización en servidor, controles CSRF cuando haya sesiones basadas en cookies, límites de petición y protección de secretos.

CORS no es un sistema de autenticación. El proxy de Next.js tampoco lo es.

Las credenciales MySQL permanecen en el backend mediante `DB_*`. No las incluyas en variables `NEXT_PUBLIC_*`, en el repositorio ni en capas de imágenes Docker.

## Dependencias

Genera y versiona los dos lockfiles. Revisa cambios de versiones y `npm audit`. No apliques `npm audit fix --force` como automatismo. Para un despliegue estable, fija también el digest de la imagen base y programa su actualización deliberada.

## Pruebas y mantenimiento

Comprueba tipos en ambos servicios, ejecuta el lint del frontend, las pruebas HTTP del backend y la prueba de humo a través de Next.js. Antes de liberar una versión, construye las imágenes compiladas y ejecuta los smoke tests contra el entorno resultante.

Añade pruebas de negocio y de navegador al incorporar formularios, permisos y operaciones de escritura. Las pruebas iniciales de esta plantilla no cubren esos casos.

Actualiza `docs/` cuando cambien endpoints, variables, instrucciones de arranque o comportamiento. No inventes una prueba superada si una herramienta no estaba disponible.
