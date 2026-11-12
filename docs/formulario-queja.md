# Formulario de nueva queja

La ruta `/quejas/nueva`, accesible desde «Crear una queja» en la cabecera, presenta la estructura solicitada el **29 de octubre de 2026**, conectada al alta por API el **30 de octubre de 2026**. La v1 funcional queda guardada en `0a8d018`; la v2 añade población, Lugar al principio del detalle y calendario. Se organiza en datos personales, datos del suceso y reclamación; utiliza dos columnas en escritorio y una en móvil.

| Campo | Obligatorio | Presentación |
| --- | --- | --- |
| Nombre | Sí | Texto |
| Apellidos | Sí | Texto |
| Dirección | No | Calle, número y piso |
| Código postal | No | Texto, conserva ceros iniciales |
| Teléfono | No | Entrada de teléfono |
| Correo electrónico | Sí | Entrada de correo |
| DNI | No | Texto |
| Fecha | Sí | Selector de calendario nativo |
| Hora | Sí | Entrada de hora `hh:mm` |
| Línea | Sí | Desplegable del catálogo del CRM |
| Población | No | Nombre del catálogo; valor `id_m_zona` |
| Núm. vehículo | No | Texto |
| Lugar | No | Texto |
| Parada | No | Texto |
| Sentido | No | Texto |
| Motivo de reclamación | No | Área de texto |

Los 16 campos conservan los seis obligatorios. Los asteriscos y el atributo HTML `required` los identifican. Además de las comprobaciones nativas del navegador, el backend valida tipos, longitudes, correo, fecha real de calendario, hora y existencia de línea y población seleccionadas. El calendario utiliza `type="date"`, con años 1000–9999; su presentación depende del navegador y el idioma. El valor HTML `aaaa-mm-dd` se convierte a `dd-mm-aaaa` al enviar, sin usar objetos Date ni cambiar de día por zona horaria. Los límites y el JSON se describen en [api.md](api.md).

## Catálogo de líneas

El formulario carga `GET /api/lineas`, a través de Next.js y del backend NestJS. Las opciones muestran `crm_lineas_tusgsal_amb.nom_linea_tusgsal`; su valor es **`id_linea_amb`**, nombre real de la clave del catálogo local. No existe un campo `id_amb` en la tabla verificada. La API enumera únicamente estas dos columnas y excluye nombres nulos o vacíos.

El frontend comprueba el contrato recibido, cancela la lectura al salir de la página y aplica un timeout de diez segundos. El desplegable indica carga, catálogo vacío o error; queda deshabilitado si no puede ofrecer opciones. No se introducen líneas ficticias como alternativa. Los nombres repetidos conservan sus distintos identificadores.

## Envío y confirmación

`GET /api/poblaciones` carga `crm_m_zona_poblaciones.poblacion` como etiqueta e `id_m_zona` como valor de «Población». El campo es opcional: «Sin especificar» envía null y conserva `m_zona` NULL. Tiene carga, catálogo vacío y error independientes de las líneas; si no está disponible se puede enviar sin población. La API comprueba la población seleccionada dentro de la transacción antes de insertar.

«Enviar queja» envía los 16 campos por `POST /api/quejas`, con `linea` y la `zona` seleccionada como números, o zona null. El botón y los campos se deshabilitan mientras se espera, y un bloqueo adicional evita envíos simultáneos por clic, teclado o `requestSubmit`. Sin catálogo de líneas disponible no se permite enviar. La petición tiene un timeout de 30 segundos y no se reenvía automáticamente.

El backend crea `crm_incidencia`, `crm_respuesta` y `crm_expediente` en una transacción. Solo después del COMMIT devuelve HTTP 201 con el código y estado `Pendiente`. El frontend comprueba ese contrato, limpia el formulario y muestra la confirmación. «Crear otra queja» presenta campos vacíos; el enlace a consulta no incluye datos personales ni el código en la URL. No se guardan datos en cookies o almacenamiento web.

Un 400 conserva los campos para corregirlos. Los demás fallos conservan lo escrito y avisan de que no se pudo confirmar el envío: un timeout o una respuesta perdida no permiten asegurar desde el navegador que la transacción no se haya completado. No hay deduplicación entre peticiones distintas. El alta registra dos avisos de correo en la misma transacción y un consumidor separado los envía cuando está configurado; el código mostrado confirma el alta, no la entrega del correo. `medio = 'correo electronico'` sigue siendo un dato inicial de respuesta; el aviso se genera explícitamente desde el repositorio. Véase [notificaciones-correo.md](notificaciones-correo.md).

## Correspondencia confirmada

Dirección y Código postal se guardan en **`dp_correoPostal`**, el nombre existente, con formato `dirección Cp: código postal`. No existe `dp_codigoPostal`. Si falta un componente se conserva el otro; sin ambos se guarda NULL. La población seleccionada se guarda por id en `m_zona`.

En la v2, Lugar y Motivo se guardan en `m_detalle` con el formato `[Lugar proporcionado por el usuario: LUGAR] Motivo`, sustituyendo los textos de ejemplo por los introducidos. La aclaración posterior del usuario elimina los paréntesis que rodeaban esos dos valores. Sin Lugar se guarda solo el motivo; con Lugar y sin motivo se guarda solo la anotación entre corchetes; sin ambos se guarda NULL. El texto se presenta sin interpretar HTML.

Los apellidos se guardan como apellidos del solicitante; no se convierten en un código AMB. Desde el 2 de noviembre de 2026, la consulta solo compara con `dp_apellidos` si el identificador empieza por QU, sin distinguir mayúsculas. Una nueva queja se puede consultar con su código y correo o DNI, sin exigir ese prefijo a esos campos. La tabla completa de destinos, constantes, nulos, estados y fechas está en [altas-quejas.md](base-de-datos/altas-quejas.md).
