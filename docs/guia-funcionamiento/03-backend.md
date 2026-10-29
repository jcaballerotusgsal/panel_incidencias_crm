# 03 · Cómo funciona el backend

El backend es la aplicación que decide cómo atender la consulta y cómo acceder a los datos. El navegador no puede saltarse sus reglas cambiando una etiqueta o una comprobación del frontend.

## Qué ocurre al arrancar

El punto de entrada es [main.ts](../../backend/src/main.ts). La función `bootstrap` crea una aplicación NestJS con el adaptador Express, comprueba `PORT` y configura:

- El prefijo global `api`, que se añade a las rutas de los controladores.
- Un `ValidationPipe` global para transformar cuerpos en DTO y aplicar sus validadores.
- El rechazo de propiedades extra con `whitelist: true` y `forbidNonWhitelisted: true`.
- Swagger cuando `ENABLE_SWAGGER` vale exactamente `'true'`.
- Hooks de apagado para cerrar recursos, incluido el pool MySQL.

Después escucha en `0.0.0.0:3001` dentro del contenedor. `0.0.0.0` significa que acepta conexiones en sus interfaces; el puerto que puede abrirse desde Windows depende de Compose.

[AppModule](../../backend/src/app.module.ts) es el módulo raíz. Importa `HealthModule` e `IncidenciasModule`, y registra `AppController` para la información básica de la API.

## Las responsabilidades de cada clase

| Pieza de incidencias | Responsabilidad | Archivo |
| --- | --- | --- |
| Módulo | Declara qué clases pertenecen al dominio y qué módulo de datos necesita | [incidencias.module.ts](../../backend/src/incidencias/incidencias.module.ts) |
| Controlador | Relaciona método/ruta HTTP con una operación | [incidencias.controller.ts](../../backend/src/incidencias/incidencias.controller.ts) |
| DTO | Comprueba el cuerpo recibido antes de ejecutar el servicio | [consultar-incidencia.dto.ts](../../backend/src/incidencias/consultar-incidencia.dto.ts) |
| Servicio | Coordina búsqueda, log, resultado y errores de negocio | [incidencias.service.ts](../../backend/src/incidencias/incidencias.service.ts) |
| Repositorio de incidencias | Contiene el SQL de lectura y monta la incidencia con los estados | [incidencias.repository.ts](../../backend/src/incidencias/incidencias.repository.ts) |
| Repositorio de logs | Prepara el instante UTC y el INSERT del intento | [logs-consultas.repository.ts](../../backend/src/incidencias/logs-consultas.repository.ts) |
| Servicio de base de datos | Mantiene el pool y ejecuta SQL con parámetros y límites de tiempo | [database.service.ts](../../backend/src/database/database.service.ts) |

Esta separación permite cambiar la presentación sin tocar SQL y probar la lógica sin conectarse a la base de datos real.

## Decoradores e inyección de dependencias

Los elementos que empiezan por `@` son decoradores. En este proyecto aportan información que NestJS usa para organizar la aplicación:

| Decorador | Cómo se usa |
| --- | --- |
| `@Module` | Registra módulos importados, controladores y proveedores |
| `@Controller('incidencias')` | Añade el segmento `incidencias` a las rutas de ese controlador |
| `@Post('consulta')` | Atiende un POST en el segmento `consulta` |
| `@Body()` | Obtiene el cuerpo de la petición y permite validarlo como DTO |
| `@Injectable()` | Marca una clase para que NestJS pueda gestionarla como dependencia |
| `@ApiProperty`, `@ApiResponse` | Describen entrada y respuestas en Swagger |

La ruta completa resulta de sumar `api` + `incidencias` + `consulta`.

El constructor de `IncidenciasController` pide `IncidenciasService`; NestJS se lo proporciona. El servicio pide sus repositorios, y estos piden `DatabaseService`. Esa entrega automática se llama **inyección de dependencias**. Las clases no necesitan crear manualmente sus propias conexiones ni sus colaboradores. `DatabaseModule` exporta el servicio de datos para que `IncidenciasModule` lo pueda usar.

## Qué acepta el DTO

`ConsultarIncidenciaDto` admite solamente `codigoIncidencia` e `identificador`.

El código puede ser un entero entre 1 y 2147483647 o una cadena de uno a diez dígitos que represente un valor dentro de ese rango. Por ejemplo, `417` y `"00417"` buscan la misma incidencia, pero la segunda forma permite conservar sus ceros en el log. Las cadenas con espacios, signos, decimales o notación exponencial se rechazan.

El identificador debe ser texto, contener algún carácter distinto de espacio y tener como máximo 45 caracteres contando el texto recibido. El DTO no intenta deducir si es DNI, correo o AMB: el repositorio compara contra los tres campos.

Si falla esta validación, NestJS responde 400 antes de ejecutar `IncidenciasService`. Tampoco acepta un `Valida` enviado por el cliente: el servidor calcula ese valor. `transform: true` no autoriza a convertir cualquier dato libremente; los validadores del DTO siguen definiendo qué es aceptable.

## El servicio y la espera del log

En `IncidenciasService.consultar`, `new Date()` captura el instante de inicio después de validar la entrada. La búsqueda recibe el código convertido a número y el identificador con espacios exteriores recortados. El DTO conserva los textos originales para el log.

La lectura está dentro de `try` y el registro en `finally`. Esto hace que se intente registrar tanto una coincidencia como una ausencia o un error de lectura. `await` espera a que la operación termine antes de continuar; una `Promise` representa ese resultado futuro.

Si no se encuentra una incidencia, el servicio lanza `NotFoundException` después de guardar el log. Si se encuentra y el log se confirma, devuelve `{ incidencia }`. Si falla el log, se devuelve 503, aunque la lectura hubiera encontrado datos. Si falla la lectura y el log se guarda, se conserva el error de lectura; si fallan ambas operaciones, prevalece el fallo del log lanzado desde `finally`.

## Acceso a MySQL y tratamiento de errores

`DatabaseService` utiliza `mysql2/promise`. El pool admite hasta cuatro conexiones, una cola de hasta veinte solicitudes, conexión y operaciones con límite de cinco segundos, `multipleStatements: false` y fechas como cadenas con `dateStrings: true`.

`read` ejecuta una consulta fija con valores separados y devuelve filas. `insert` exige que se confirme exactamente una fila insertada. Ambos convierten los fallos internos del driver en mensajes públicos de servicio no disponible; no publican SQL ni identificadores.

Crear el pool no importa el esquema ni ejecuta migraciones. Si falta configuración `DB_*`, el servicio conserva un pool nulo: la salud puede funcionar y las consultas devolverán 503. Al apagarse NestJS, `onModuleDestroy` cierra el pool.

El controlador permanece pequeño porque delega esta coordinación. Añade `@HttpCode(200)` para que el POST de consulta devuelva 200 al tener éxito, y `Cache-Control: no-store` para la respuesta correcta. NestJS convierte las excepciones HTTP en respuestas de error.

[← Frontend](02-frontend.md) · [Siguiente: API y recorrido completo →](04-api-y-consulta.md)
