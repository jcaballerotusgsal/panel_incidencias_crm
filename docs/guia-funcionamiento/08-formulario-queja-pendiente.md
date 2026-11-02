# 08 · Cómo se crea una queja

El formulario de `/quejas/nueva` está integrado desde la v2. Su página compone la estructura; React carga catálogos, recoge campos y envía JSON. NestJS valida y crea las filas relacionadas del CRM. Este archivo conserva su nombre histórico para mantener los enlaces de la guía.

## La página y sus campos

| Grupo | Campos | Obligatorios |
| --- | --- | --- |
| Datos personales | Nombre, Apellidos, Dirección, Código postal, Teléfono, Correo electrónico y DNI | Nombre, Apellidos y Correo electrónico |
| Datos del suceso | Fecha, Hora, Línea, Núm. vehículo, Población, Lugar, Parada y Sentido | Fecha, Hora y Línea |
| Reclamación | Motivo de reclamación | Ninguno |

Son 16 campos y seis obligatorios. El código postal es texto para conservar ceros iniciales. El calendario HTML entrega `aaaa-mm-dd`; el componente invierte sus partes para enviar `dd-mm-aaaa`, sin convertir zonas horarias. Hora utiliza `hh:mm`. El DTO vuelve a validar tipos, longitudes y fechas reales aunque el navegador ya haya validado.

## Los catálogos y sus ids

`GET /api/lineas` devuelve `id_linea_amb` y `nom_linea_tusgsal` desde `crm_lineas_tusgsal_amb`. En una opción sintética `<option value="7">B1</option>`, la persona ve `B1` y la API recibe el número `7`. La clave real es `id_linea_amb`, aunque la petición inicial la llamaba `id_amb`.

`GET /api/poblaciones` devuelve `id_m_zona` y `poblacion` desde `crm_m_zona_poblaciones`. El selector muestra el nombre y envía el id numérico como `zona`. Es opcional: sin selección envía null. Ambos catálogos excluyen nombres nulos o vacíos, se ordenan por nombre e id y conservan ids distintos aunque se repitan nombres.

El frontend valida ambos JSON y representa carga, catálogo vacío y error por separado. Sin líneas disponibles bloquea el envío; sin poblaciones permite enviar con zona null. Los GET no reciben datos personales ni crean logs de búsqueda. Se mantiene la cadena navegador → Next.js → NestJS → MySQL.

## Del botón a la transacción

1. `FormularioQueja` recoge los campos con `FormData`, convierte ids y fecha y envía `POST /api/quejas`.
2. Un bloqueo evita envíos simultáneos y los campos se deshabilitan mientras se espera, con timeout de 30 segundos.
3. `CrearQuejaDto` recorta textos y valida el cuerpo; rechaza estados, ids generados y fechas de recepción impuestos por el cliente.
4. `QuejasService` fija una sola fecha/hora de recepción en Europe/Madrid y prepara dirección postal y detalle.
5. `QuejasRepository` usa una transacción de `DatabaseService`: comprueba línea y población seleccionadas y ejecuta los tres INSERT en orden.
6. Tras COMMIT, la API devuelve 201 con `{ "codigoIncidencia": 417, "estado": "Pendiente" }`, ejemplo sintético.
7. El frontend valida esa respuesta, limpia el formulario y muestra el código. «Crear otra queja» vuelve a presentar campos vacíos.

## Qué guarda cada tabla

| Paso | Tabla | Valores y relación |
| --- | --- | --- |
| 1 | `crm_incidencia` | Formulario, canal `formulario web`, tipo `Queja`, población en `m_zona` y fechas del servidor |
| 2 | `crm_respuesta` | `id_incidencia` anterior, `estado = pendiente`, `estado2 = abierta` y medio `correo electronico` |
| 3 | `crm_expediente` | `id_incidencia` del primer paso, `id_resolucion` del segundo y estado `Pendiente` |

Dirección y CP se unen como `dirección Cp: código postal` en `dp_correoPostal`. Lugar precede al motivo en `m_detalle` como `[Lugar proporcionado por el usuario: LUGAR] Motivo`, sin añadir paréntesis. Sin Lugar se guarda solo el motivo; sin ambos, NULL. Apellidos sigue siendo el apellido del solicitante. Las constantes, nulos y fechas se detallan en [altas-quejas.md](../base-de-datos/altas-quejas.md).

Las tres inserciones comparten conexión y transacción. Un fallo intenta ROLLBACK; no se confirma un alta parcial. Una opción ya no disponible responde 400. Un fallo que impide confirmar el alta responde 503. Si se pierde la respuesta en red, la queja podría haberse guardado: no hay deduplicación entre peticiones distintas ni reenvío automático.

## Archivos para seguir el recorrido

| Archivo | Responsabilidad |
| --- | --- |
| [page.tsx](../../frontend/src/app/quejas/nueva/page.tsx) | Estructura de la página |
| [formulario-queja.tsx](../../frontend/src/components/formulario-queja.tsx) | Campos, catálogos, calendario, envío y confirmación |
| [lineas.ts](../../frontend/src/lib/lineas.ts), [poblaciones.ts](../../frontend/src/lib/poblaciones.ts), [quejas.ts](../../frontend/src/lib/quejas.ts) | Tipos y comprobación del JSON externo |
| [crear-queja.dto.ts](../../backend/src/quejas/crear-queja.dto.ts) | Validación de entrada |
| [quejas.controller.ts](../../backend/src/quejas/quejas.controller.ts) | Endpoint POST y delegación |
| [quejas.service.ts](../../backend/src/quejas/quejas.service.ts) | Preparación de campos y recepción |
| [quejas.repository.ts](../../backend/src/quejas/quejas.repository.ts) | Validación de opciones y tres INSERT |
| [database.service.ts](../../backend/src/database/database.service.ts) | Conexión compartida, COMMIT y ROLLBACK |

El alta no envía correo: `medio` es un dato inicial de respuesta. Tampoco crea un log de consulta ni guarda campos en almacenamiento web. Puedes consultar después la incidencia con su código y correo o DNI. Los contratos están en [API](../api.md) y las comprobaciones ejecutadas en [validación](../validacion.md).

[← Pruebas y lectura del código](07-pruebas-y-lectura-del-codigo.md) · [Volver al índice](README.md)
