# Instrucciones para trabajar en este proyecto

## Alcance y arquitectura

- Este repositorio implementa un módulo/backoffice de un CRM existente; reutilizar su esquema y sus reglas, no diseñar una base nueva por defecto.
- No modificar el entorno PHP original ni la estructura de su base de datos sin autorización expresa.
- Backend: NestJS 11 sobre Express, Node.js 24 y TypeScript.
- Frontend: Next.js 16 / React 19, Tailwind CSS 4 y TypeScript.
- Conservar las ramas de versiones elegidas salvo una actualización explícita y probada.
- No crear un servidor Express adicional ni conectar el navegador directamente a una base de datos.
- El navegador usa `/api`; Next.js reenvía a `http://localhost:3001/api`.

## Ramas y entregas

- `main` es la referencia estable para producción; reservar su integración para entregas validadas.
- `develop` integra el trabajo de desarrollo y es la base de las ramas de cada tarea o sección.
- Crear ramas con nombres descriptivos: `feat/<funcionalidad>`, `fix/<correccion>` o `chore/<tarea>`.
- Integrar las ramas de tarea en `develop`; promover `develop` a `main` cuando corresponda preparar una entrega.
- Seguir el flujo y las comprobaciones descritos en `docs/ramas.md`.

## Documentación

Antes de modificar, consulta `docs/README.md`, `docs/arquitectura.md` y `docs/buenas-practicas.md`.
Consulta `docs/docker.md` al cambiar servicios, puertos, builds o dependencias.
Consulta `docs/api.md` al añadir o modificar endpoints.
Consulta `docs/base-de-datos/README.md` antes de trabajar con consultas, entidades, vistas, conexiones o permisos de datos; sigue su índice hacia las tablas y reglas afectadas.
Mantén la documentación afectada en el mismo cambio que el código.
Guarda notas provisionales solo en `.local/`; traslada las decisiones duraderas a `docs/`.

## Base de datos del CRM

- Compatibilidad requerida: MySQL 5.7.21. No sustituir por MySQL 8, otra revisión ni otro motor sin autorización.
- `docs/base-de-datos/esquema.sql` es una instantánea de referencia, no una migración ni un script de inicialización autorizado. Contiene `DROP` y desactiva comprobaciones de claves foráneas: no ejecutarlo automáticamente.
- Consultar `diccionario.md`, `relaciones.md` y `vistas.md` dentro de `docs/base-de-datos/`; revisar `reglas-negocio.md` y `pendientes.md` antes de escribir datos.
- Distinguir relaciones declaradas por clave foránea, uniones escritas en vistas e hipótesis no confirmadas. No convertir una hipótesis en contrato del módulo.
- Conservar nombres, tipos, nulabilidad, índices, codificación e intercalaciones existentes. No corregir nombres históricos ni añadir restricciones sin una propuesta aprobada.
- No crear, alterar, eliminar ni sincronizar automáticamente objetos. Si se incorpora TypeORM, establecer `synchronize: false`; no ejecutar migraciones automáticamente.
- Las tablas y vistas de esta instantánea no garantizan que el esquema desplegado sea idéntico. Documentar procedencia, fecha y discrepancias antes de operar.
- La conexión a MySQL pertenece al backend. Mantener credenciales fuera del frontend, de `docs/` y de variables `NEXT_PUBLIC_*`.
- Utilizar consultas parametrizadas, enumerar columnas necesarias y limitar los datos personales devueltos. Nunca devolver `crm_users.password` en respuestas API ni registrarlo en logs.
- No deducir el algoritmo de autenticación por el nombre o tamaño de `password`, ni estados válidos a partir de valores predeterminados.
- No asumir una fila por incidencia o actuación al consultar las vistas; comprobar la cardinalidad de respuestas y definir la granularidad del resultado.
- No interpretar los campos `*_date_updated`/`updated_date` como actualización automática: el DDL aportado solo declara su valor predeterminado.
- No renombrar ni recrear automáticamente el definidor `atlas`@`%` de las vistas; revisar sus dependencias y permisos en una actuación autorizada.
- Empezar el desarrollo de datos con consultas sobre una copia local autorizada. Antes de escribir, confirmar reglas, alcance, permisos y dependencias del CRM.
- No guardar registros reales, contraseñas ni copias de datos en esta documentación. La instantánea describe estructura; los ejemplos adicionales deberán ser sintéticos.
- Actualizar documentación y trazabilidad con cada cambio aprobado; marcar explícitamente lo no verificado. No alterar el esquema de referencia para hacer coincidir una suposición.

## Código y comentarios

- Documenta cada función, método y constructor nuevo o modificado con JSDoc/TSDoc.
- Explica propósito, parámetros, resultado, errores y efectos relevantes; evita comentarios obvios.
- Mantén controladores delgados y lógica de negocio en servicios.
- Usa DTO y validación para datos de entrada; verifica datos externos en el frontend.
- No uses `any` ni silencios de tipos como solución rápida a errores.
- Usa Tailwind 4 con `@tailwindcss/postcss`; no copies instrucciones de Tailwind 3 sin adaptación.
- Al usar documentación incluida en dependencias, comprueba que corresponda a la versión instalada.

## Dependencias y Docker

- Los `package-lock.json` son parte del proyecto: generarlos, revisar y versionar.
- No sustituir `npm ci` por instalaciones no reproducibles en las imágenes compiladas.
- No instalar dependencias globales en el equipo como requisito del proyecto.
- Los cambios de dependencias deben actualizar el manifiesto y el lockfile juntos.
- No ejecutar instalaciones concurrentes sobre el mismo volumen `node_modules`.
- Las comprobaciones dentro de un contenedor requieren permisos y herramientas disponibles.

## Seguridad

- No introducir secretos en código, imágenes, documentación ni variables `NEXT_PUBLIC_*`.
- No añadir acceso a producción, migraciones ni datos reales sin autorización expresa.
- No borrar volúmenes ni ejecutar limpiezas globales de Docker.
- No desactivar controles de seguridad para ocultar errores de configuración.
- Swagger solo está habilitado por defecto en desarrollo.
- Estas instrucciones no son una barrera de permisos: conservar aislamiento y privilegios mínimos.

## Antes de finalizar

Ejecuta las comprobaciones aplicables documentadas en `docs/docker.md`.
Resume archivos modificados, pruebas realizadas, resultado y cualquier comprobación pendiente.
No afirmes que Docker, npm, una compilación o un navegador han funcionado si no se ejecutaron.
