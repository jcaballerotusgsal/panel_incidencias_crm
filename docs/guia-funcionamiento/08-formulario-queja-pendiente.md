# 08 · El formulario de queja pendiente de integrar

Este capítulo describe el trabajo preparado antes de esta guía en `feat/formulario-nueva-queja`. **No forma parte de la base `develop` `bf825c8` que se está documentando.** Sus archivos no estarán presentes al recorrer esta rama de documentación; se enumeran como referencia del trabajo separado, sin enlaces a rutas de código ausentes.

El objetivo de esa fase es tener una página con la estructura de la queja. La única consulta añadida es la carga del catálogo para el desplegable de líneas; no se implementa el envío ni el guardado de reclamaciones.

## La página y sus campos

La ruta preparada es `/quejas/nueva`, con enlace desde la cabecera y estos grupos:

| Grupo | Campos | Obligatorios |
| --- | --- | --- |
| Datos personales | Nombre, Apellidos, Dirección, Código postal, Teléfono, Correo electrónico y DNI | Nombre, Apellidos y Correo electrónico |
| Datos del suceso | Fecha, Hora, Línea, Núm. vehículo, Lugar, Parada y Sentido | Fecha, Hora y Línea |
| Reclamación | Motivo de reclamación | Ninguno en esta fase |

Son 15 campos y seis obligatorios. Fecha utiliza el formato `dd-mm-aaaa`; Hora, `hh:mm`. El código postal es texto para conservar ceros iniciales. Las comprobaciones HTML de formato no son todavía reglas de creación del CRM.

## Por qué se añade un endpoint de líneas

Para mostrar nombres reales, la estructura preparada hace `GET /api/lineas`. El backend lee exclusivamente `id_linea_amb` y `nom_linea_tusgsal` de `crm_lineas_tusgsal_amb`. El nombre real de la clave es `id_linea_amb`, aunque la petición inicial la denominaba `id_amb`.

En una opción sintética como `<option value="7">B1</option>`, `B1` es lo que ve la persona y `7` es el valor seleccionado. Dos nombres iguales pueden conservar ids diferentes. La consulta excluye nombres nulos o vacíos y los ordena por nombre e id; no inventa opciones si falla la carga.

El componente valida la respuesta y contempla carga, catálogo vacío y error. El GET no recibe datos personales ni crea logs de consulta de incidencias. No se conecta el navegador directamente a MySQL: se reutiliza la misma cadena Next.js → NestJS → MySQL.

## Cómo se reparte ese trabajo

| Archivos preparados en la otra tarea | Responsabilidad |
| --- | --- |
| `frontend/src/app/quejas/nueva/page.tsx` | Estructura de la página |
| `frontend/src/components/formulario-queja.tsx` | Campos, catálogo y prevención del envío |
| `frontend/src/lib/lineas.ts` | Tipo y comprobación del JSON del catálogo |
| `backend/src/lineas/` | Módulo, controlador, servicio y repositorio de lectura |
| `backend/test/lineas.test.cjs` | Pruebas del contrato y fallos del catálogo |

El botón de envío está deshabilitado y el formulario cancela `submit`, incluido el programático. No hay un POST de creación ni datos personales guardados en almacenamiento web. Los nombres HTML de los campos no establecen todavía su correspondencia de escritura con las columnas del CRM.

Antes del alta habrá que confirmar los destinos de los campos, los obligatorios de la base, las reglas de negocio y el uso histórico de `dp_apellidos`. La guía deberá actualizarse cuando esta funcionalidad se integre en `develop`; hasta entonces, no debe confundirse este GET pendiente con los endpoints integrados del [capítulo 04](04-api-y-consulta.md).

[← Pruebas y lectura del código](07-pruebas-y-lectura-del-codigo.md) · [Volver al índice](README.md)
