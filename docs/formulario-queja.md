# Formulario de nueva queja

La ruta `/quejas/nueva`, accesible desde «Crear una queja» en la cabecera, presenta la estructura solicitada el **29 de octubre de 2026**, conectada al alta por API el **30 de octubre de 2026**. Se organiza en datos personales, datos del suceso y reclamación; utiliza dos columnas en escritorio y una en móvil.

| Campo | Obligatorio | Presentación |
| --- | --- | --- |
| Nombre | Sí | Texto |
| Apellidos | Sí | Texto |
| Dirección | No | Calle, número y piso |
| Código postal | No | Texto, conserva ceros iniciales |
| Teléfono | No | Entrada de teléfono |
| Correo electrónico | Sí | Entrada de correo |
| DNI | No | Texto |
| Fecha | Sí | Texto `dd-mm-aaaa` con patrón de formato |
| Hora | Sí | Entrada de hora `hh:mm` |
| Línea | Sí | Desplegable del catálogo del CRM |
| Núm. vehículo | No | Texto |
| Lugar | No | Texto |
| Parada | No | Texto |
| Sentido | No | Texto |
| Motivo de reclamación | No | Área de texto |

Los asteriscos y el atributo HTML `required` identifican los seis campos obligatorios. Además de las comprobaciones nativas del navegador, el backend valida tipos, longitudes, correo, fecha real de calendario, hora y existencia de la línea. Los límites y el JSON se describen en [api.md](api.md).

## Catálogo de líneas

El formulario carga `GET /api/lineas`, a través de Next.js y del backend NestJS. Las opciones muestran `crm_lineas_tusgsal_amb.nom_linea_tusgsal`; su valor es **`id_linea_amb`**, nombre real de la clave del catálogo local. No existe un campo `id_amb` en la tabla verificada. La API enumera únicamente estas dos columnas y excluye nombres nulos o vacíos.

El frontend comprueba el contrato recibido, cancela la lectura al salir de la página y aplica un timeout de diez segundos. El desplegable indica carga, catálogo vacío o error; queda deshabilitado si no puede ofrecer opciones. No se introducen líneas ficticias como alternativa. Los nombres repetidos conservan sus distintos identificadores.

## Envío y confirmación

«Enviar queja» envía los 15 campos por `POST /api/quejas`, con `linea` como número. El botón y los campos se deshabilitan mientras se espera, y un bloqueo adicional evita envíos simultáneos por clic, teclado o `requestSubmit`. Sin catálogo disponible no se permite enviar. La petición tiene un timeout de 30 segundos y no se reenvía automáticamente.

El backend crea `crm_incidencia`, `crm_respuesta` y `crm_expediente` en una transacción. Solo después del COMMIT devuelve HTTP 201 con el código y estado `Pendiente`. El frontend comprueba ese contrato, limpia el formulario y muestra la confirmación. «Crear otra queja» presenta campos vacíos; el enlace a consulta no incluye datos personales ni el código en la URL. No se guardan datos en cookies o almacenamiento web.

Un 400 conserva los campos para corregirlos. Los demás fallos conservan lo escrito y avisan de que no se pudo confirmar el envío: un timeout o una respuesta perdida no permiten asegurar desde el navegador que la transacción no se haya completado. No hay deduplicación entre peticiones distintas ni envío de correo; `medio = 'correo electronico'` solo inicializa el registro de respuesta.

## Correspondencia confirmada

Dirección y Código postal se guardan en **`dp_correoPostal`**, el nombre existente, con formato `dirección Cp: código postal`. No existe `dp_codigoPostal`. Si falta un componente se conserva el otro; sin ambos se guarda NULL. Lugar se acepta pero **no se guarda**, según la aclaración del usuario. Motivo va a `m_detalle` y `m_zona` queda NULL.

Los apellidos se guardan como apellidos del solicitante; no se convierten en un código AMB. La consulta histórica sigue comparando `dp_apellidos` por su regla anterior, pero una nueva queja se puede consultar con su código y correo o DNI. La tabla completa de destinos, constantes, nulos, estados y fechas está en [altas-quejas.md](base-de-datos/altas-quejas.md).
