# Formulario de nueva queja

La ruta `/quejas/nueva`, accesible desde «Crear una queja» en la cabecera, presenta la estructura solicitada el **29 de octubre de 2026**. Se organiza en datos personales, datos del suceso y reclamación; utiliza dos columnas en escritorio y una en móvil.

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

Los asteriscos y el atributo HTML `required` identifican los seis campos obligatorios. Se utilizan las comprobaciones nativas de formato del navegador; todavía no se implementan reglas de negocio ni comprobación de fechas de calendario.

## Catálogo de líneas

El formulario carga `GET /api/lineas`, a través de Next.js y del backend NestJS. Las opciones muestran `crm_lineas_tusgsal_amb.nom_linea_tusgsal`; su valor es **`id_linea_amb`**, nombre real de la clave del catálogo local. No existe un campo `id_amb` en la tabla verificada. La API enumera únicamente estas dos columnas y excluye nombres nulos o vacíos.

El frontend comprueba el contrato recibido, cancela la lectura al salir de la página y aplica un timeout de diez segundos. El desplegable indica carga, catálogo vacío o error; queda deshabilitado si no puede ofrecer opciones. No se introducen líneas ficticias como alternativa. Los nombres repetidos conservan sus distintos identificadores.

## Alcance de esta fase

El botón «Enviar queja» permanece deshabilitado y el formulario cancela el evento de envío, también por teclado o mediante `requestSubmit`. No se crea un endpoint de alta, no se guardan quejas ni se añaden logs al cargar el catálogo. Los campos personales no se envían a la API ni se guardan en cookies o almacenamiento web.

Los nombres HTML de los campos describen la interfaz; no definen todavía su correspondencia de escritura con el CRM. Antes de incorporar el guardado deben confirmarse los campos de destino, las reglas de creación y el significado histórico de `dp_apellidos`, empleado en la consulta existente como identificador AMB.
