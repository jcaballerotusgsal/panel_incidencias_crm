# 07 · Pruebas y cómo seguir el código

Para entender un cambio conviene distinguir tres preguntas: si el código tiene tipos válidos, si sus reglas funcionan y si los servicios reales se comunican. Cada comprobación aporta una evidencia diferente.

## Qué comprueba cada comando

Son los comandos documentados para desarrollo, con los servicios ya iniciados. Se muestran como referencia de aprendizaje; esta tarea de documentación no los ha vuelto a ejecutar.

| Comando desde la raíz | Qué comprueba | Qué no demuestra |
| --- | --- | --- |
| `docker compose exec backend npm run typecheck` | Tipos TypeScript del backend | Conexión real o comportamiento HTTP |
| `docker compose exec backend npm test` | Compila NestJS y ejecuta las pruebas de `backend/test/` | Funcionamiento de una copia real del CRM |
| `docker compose exec frontend npm run typecheck` | Genera tipos de rutas y comprueba TypeScript del frontend | Que una interacción funcione en un navegador |
| `docker compose exec frontend npm run lint` | Reglas de calidad y errores detectables por ESLint | Resultado de una consulta SQL |
| `docker compose exec frontend npm run test:smoke` | Next.js, proxy, API y una consulta sintética sin coincidencia con el entorno local | Una búsqueda positiva real o toda la interacción visual |

Los scripts concretos están en los `package.json` de [backend](../../backend/package.json) y [frontend](../../frontend/package.json). Las pruebas HTTP usan el ejecutor de tests de Node.js.

## Pruebas del backend

[health.test.cjs](../../backend/test/health.test.cjs) comprueba contratos de salud, identificación del servicio y ruta inexistente. [incidencias.test.cjs](../../backend/test/incidencias.test.cjs) cubre validación, resultados, parámetros SQL, estados, registro de intentos, espera del INSERT y errores.

Estas pruebas usan datos sintéticos y *dobles* de dependencias: implementaciones de prueba que devuelven valores controlados o simulan fallos. Así se puede comprobar, por ejemplo, que un log fallido responde 503 sin depender de provocar una caída real de MySQL. No insertan filas reales en el CRM.

`npm test` recompila el directorio `dist`, que observa el proceso de desarrollo. Si el watcher queda sirviendo código anterior o aparece `EADDRINUSE`, el procedimiento documentado es reiniciar solo el backend tras terminar las pruebas y repetir el smoke. No hace falta eliminar volúmenes.

## Qué hace la prueba de humo

Abre [scripts/smoke.mjs](../../frontend/scripts/smoke.mjs). Comprueba `/health`, `/api/health`, `/api`, el formulario de inicio y la página de resultado. Envía un cuerpo inválido para confirmar 400 y una pareja sintética sin coincidencia para confirmar 404.

El 404 **genera un log sintético** con el identificador `SMOKE-SIN-COINCIDENCIA`; el 400 no escribe. Por eso el smoke requiere las tablas locales y permisos de lectura e inserción. No es una prueba de navegador: descargar HTML no comprueba por sí solo los clics, la hidratación o la distribución en móvil.

Las comprobaciones con navegador y SQL real realizadas en tareas anteriores, junto con sus límites, están descritas en [validacion.md](../validacion.md). Los scripts provisionales de `.local/` pueden ayudar en una sesión local, pero no forman parte del conjunto versionado de pruebas ni son un requisito para leer esta guía.

## Seguir una petición en el navegador

En el entorno local, abre las herramientas de desarrollo y la pestaña **Red / Network**. Al enviar el formulario puedes buscar `incidencias/consulta` y revisar:

1. La dirección solicitada: debe ir al origen de Next.js y empezar por `/api`.
2. El método POST y el cuerpo JSON con los dos nombres esperados.
3. El estado HTTP y el tiempo de respuesta.
4. La respuesta: una incidencia, un 404 o un error de validación/servicio.
5. El cambio de pantalla y la conservación del resultado durante la navegación.

Usa datos sintéticos o una prueba autorizada; enviar la consulta tiene su efecto de log. No copies cuerpos con datos personales a documentación o capturas compartidas.

Recargar la ficha elimina su resultado en memoria y muestra la invitación a consultar de nuevo. Esto permite observar la diferencia entre la memoria del contexto de React y la persistencia de MySQL sin modificar una incidencia.

## Dónde buscar según lo que quieras cambiar

| Objetivo | Primeros archivos que conviene leer |
| --- | --- |
| Cambiar título o distribución inicial | [app/page.tsx](../../frontend/src/app/page.tsx) y [consulta-incidencia-form.tsx](../../frontend/src/components/consulta-incidencia-form.tsx) |
| Cambiar una etiqueta o un formato de la ficha | [resultado-incidencia.tsx](../../frontend/src/components/resultado-incidencia.tsx) |
| Entender por qué se pierde el resultado | [consulta-incidencia-context.tsx](../../frontend/src/components/consulta-incidencia-context.tsx) y [layout.tsx](../../frontend/src/app/layout.tsx) |
| Revisar qué entrada acepta la API | [consultar-incidencia.dto.ts](../../backend/src/incidencias/consultar-incidencia.dto.ts) y [main.ts](../../backend/src/main.ts) |
| Cambiar la coordinación entre búsqueda y log | [incidencias.service.ts](../../backend/src/incidencias/incidencias.service.ts) y sus pruebas |
| Entender una unión o columna de lectura | [incidencias.repository.ts](../../backend/src/incidencias/incidencias.repository.ts) y [diccionario](../base-de-datos/diccionario.md) |
| Revisar lo que se registra | [logs-consultas.repository.ts](../../backend/src/incidencias/logs-consultas.repository.ts) y [tabla de logs](../base-de-datos/logs-consultas.md) |
| Revisar el destino de `/api` | [next.config.ts](../../frontend/next.config.ts) |
| Entender un puerto o una variable | [docker-compose.yml](../../docker-compose.yml) y [Docker](../docker.md) |

Cambiar la presentación de una columna no cambia su presencia en la API. Añadir una columna a la respuesta exige revisar SQL, tipos de backend, validación del JSON en frontend, presentación, pruebas y documentación. Cualquier cambio de esquema o escritura original del CRM requiere además confirmar su autorización y sus reglas.

## Un ejercicio de lectura

Sin cambiar ni ejecutar código, sigue el ejemplo de código `"00417"` e identificador `"  prueba@example.invalid  "`:

- En el formulario, localiza dónde se conservan los textos originales.
- En el servicio, encuentra dónde se transforma el código a número y se recortan los espacios del identificador para buscar.
- En el repositorio, localiza los cuatro parámetros del primer SELECT.
- En el repositorio de logs, comprueba que se guarda `"00417"` y el identificador con sus espacios.
- En la ficha, encuentra por qué dos estados iguales se muestran una sola vez.

Si puedes explicar esas cinco decisiones, ya has recorrido entrada, transporte, reglas, persistencia y presentación de la aplicación.

[← Docker y configuración](06-docker-y-configuracion.md) · [Siguiente: formulario pendiente →](08-formulario-queja-pendiente.md)
