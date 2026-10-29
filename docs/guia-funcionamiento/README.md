# Guía para entender la aplicación

Esta guía explica cómo funciona **este proyecto**, usando sus archivos y su comportamiento actual. Puedes leerla sin conocer todavía Next.js o NestJS: los conceptos se introducen cuando hacen falta y los enlaces permiten abrir el código que los aplica.

La referencia es `develop` en el commit `bf825c8`, base de la rama `chore/guia-funcionamiento-app`, el **29 de octubre de 2026**. Incluye la consulta de incidencias, el nombre de línea, los estados de sus expedientes y el registro de consultas. El formulario de nueva queja está en un trabajo separado todavía sin integrar; se explica expresamente como pendiente en el último capítulo.

## Orden de lectura

| Capítulo | Lo que aprenderás |
| --- | --- |
| [01 · Visión general](01-vision-general.md) | Qué hace cada tecnología, cómo se conectan las piezas y qué significan los términos habituales |
| [02 · Frontend](02-frontend.md) | Páginas, componentes, formularios, estado de React, estilos y presentación del resultado |
| [03 · Backend](03-backend.md) | Arranque de NestJS, módulos, controladores, DTO, servicios, repositorios e inyección de dependencias |
| [04 · API y recorrido de una consulta](04-api-y-consulta.md) | Qué viaja por HTTP, qué devuelve cada endpoint y el recorrido completo de una búsqueda |
| [05 · Base de datos y logs](05-base-de-datos-y-logs.md) | Tablas utilizadas, relaciones, SQL parametrizado, estados y qué se registra en cada intento |
| [06 · Docker y configuración](06-docker-y-configuracion.md) | Contenedores, puertos, variables, volúmenes, recarga y modo compilado |
| [07 · Pruebas y lectura del código](07-pruebas-y-lectura-del-codigo.md) | Cómo comprobar cada capa, observar peticiones y localizar dónde cambiar algo |
| [08 · Formulario de queja pendiente](08-formulario-queja-pendiente.md) | Qué prepara la otra rama y por qué aún no forma parte de `develop` |

Si quieres entender primero una acción concreta, empieza por el [recorrido de una consulta](04-api-y-consulta.md) y abre los archivos en el orden indicado allí.

## Cómo usar los ejemplos

Los códigos, correos e incidencias de los ejemplos son **sintéticos**. Una respuesta abreviada sirve para explicar su forma y no es una fila completa ni un registro existente. Los comandos muestran cómo investigar o comprobar la aplicación; escribirlos en esta guía no significa que se hayan ejecutado durante su elaboración.

La guía es didáctica. Los contratos detallados siguen en [API](../api.md), los metadatos y reglas en [base de datos](../base-de-datos/README.md), los procedimientos de ejecución en [Docker](../docker.md) y la evidencia de comprobaciones en [validación](../validacion.md). Cuando cambie el código, deben actualizarse también los capítulos afectados.
