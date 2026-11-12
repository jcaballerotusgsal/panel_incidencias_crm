# Plantilla HTML de los correos al usuario

Edita este archivo para cambiar el diseño de los avisos de alta y cambio de estado:

**[backend/src/notificaciones/plantillas/usuario.html](../backend/src/notificaciones/plantillas/usuario.html)**

Es un único HTML compartido por los dos eventos. Incluye secciones diferenciadas para que puedas cambiar los textos y la distribución de cada uno sin modificar TypeScript. El diseño inicial usa amarillo `#f5a810`, gris `#64666b`, tablas y estilos inline. Puedes cambiar colores, espaciados, tamaños, textos y estructura en ese archivo.

## Ejemplo de edición

Para cambiar el título del correo de alta, busca `Hemos recibido tu queja` en el bloque `quejaCreada` y escribe tu texto. Para cambiar el de estado, edita el título del bloque `cambioEstado`. También puedes mover o eliminar campos; no es obligatorio utilizar todas las variables.

Los estilos se escriben como HTML de correo, por ejemplo:

```html
<p style="font-family:Arial,sans-serif;color:#64666b;font-size:16px;">
  Tu incidencia tiene el código <strong>{{codigoIncidencia}}</strong>.
</p>
```

Tailwind del frontend no se aplica a los emails. Si añades imágenes, utiliza una URL absoluta accesible por el destinatario, preferiblemente HTTPS; una ruta como `/brand/logo-direxis-tusgsal.png` o una ruta local de Windows no sirve como imagen del correo. El HTML inicial identifica la empresa mediante texto y no descarga imágenes externas.

## Variables disponibles

El sistema sustituye estas marcas al enviar. Respeta sus nombres y mayúsculas:

| Variable | Valor |
| --- | --- |
| `{{codigoIncidencia}}` | Id de la incidencia, por ejemplo `417` |
| `{{estadoActual}}` | Estado capturado por el evento; `No informado` si es NULL |
| `{{estadoAnterior}}` | Estado previo del evento; `No informado` si es NULL |
| `{{urlConsulta}}` | URL general configurada en `NOTIFICATIONS_CONSULTATION_URL` |
| `{{titulo}}` | Título predeterminado según el evento; usado en el título HTML y texto previo |
| `{{mensaje}}` | Mensaje predeterminado según el evento, opcional si prefieres usarlo en vez de los párrafos editables |

Los estados pertenecen al momento del evento; no se vuelve a consultar su valor actual en la base. No se introducen nombre, DNI, correo del destinatario ni detalle de la reclamación en la plantilla.

Las variables se sustituyen como **texto escapado**, sin interpretar HTML de la base de datos. Colócalas en textos y, para el enlace, dentro de `href="{{urlConsulta}}"` con comillas. No son variables de JavaScript ni de CSS; no se admite HTML sin escapar, evaluación de código ni variables inventadas.

## Bloques opcionales

Los marcadores se escriben dentro de comentarios HTML y deben conservar apertura/cierre:

```html
<!-- {{#quejaCreada}} -->
<h1>Gracias por contactar con nosotros</h1>
<p>Tu queja se ha registrado con el código {{codigoIncidencia}}.</p>
<!-- {{/quejaCreada}} -->

<!-- {{#cambioEstado}} -->
<h1>Información actualizada de tu incidencia</h1>
<p>Estado anterior: {{estadoAnterior}}</p>
<p>Estado actual: {{estadoActual}}</p>
<!-- {{/cambioEstado}} -->

<!-- {{#enlaceConsulta}} -->
<a href="{{urlConsulta}}">Consultar incidencia</a>
<!-- {{/enlaceConsulta}} -->
```

`quejaCreada` se muestra al registrar una queja web; `cambioEstado`, cuando el trigger detecta el cambio de un expediente; `enlaceConsulta`, cuando hay URL configurada. El archivo inicial usa ese último bloque para evitar un botón vacío si no existe URL. Se admiten bloques anidados. Si eliminas un bloque, quita también su marcador de cierre.

## Cuándo se aplican los cambios

En **desarrollo con Docker**:

1. Edita `backend/src/notificaciones/plantillas/usuario.html` y guarda.
2. El consumidor, con `NODE_ENV=development`, lee ese archivo original a través del montaje existente de `backend/`.
3. En el siguiente envío al usuario ya se utiliza su contenido nuevo. Una vez instalada esta versión, editar solo el HTML no requiere recompilar ni reiniciar el worker, ni depende de las notificaciones de cambios de Docker Desktop.

No edites `dist/` manualmente: se sobrescribe al compilar. Si ejecutas el consumidor fuera de Docker sin `NODE_ENV=development`, utiliza la copia de la compilación y recompila después de editar la plantilla. Un cambio en TypeScript sí requiere compilar y reiniciar el consumidor.

En **modo compilado**, la plantilla se incorpora a `dist` durante el build y queda incluida en la imagen del backend/worker. Hay que reconstruir y recrear los servicios afectados para distribuir un cambio de HTML; no existe un montaje de archivos editable en ese modo. Véase [Docker](docker.md).

La plantilla se elige al procesar cada aviso, incluidos los que estaban pendientes o se reintentan. Editarla no vuelve a enviar los ya marcados como enviados.

## Envío y errores

Microsoft Graph recibe el cuerpo como HTML para el usuario, según el [contrato de itemBody](https://learn.microsoft.com/en-us/graph/api/resources/itembody?view=graph-rest-1.0). Con SMTP se incluyen HTML y una alternativa de texto plano mediante los [campos html/text de Nodemailer](https://nodemailer.com/message). El aviso interno conserva su cuerpo de texto. El asunto se mantiene en `CorreoService`; este archivo personaliza el cuerpo y no cambia los destinatarios.

Si falta el archivo, está vacío, contiene una variable desconocida o un bloque mal cerrado, no se llama al proveedor para ese aviso. El worker registra el código seguro `PLANTILLA_CORREO_INVALIDA` y lo reintenta según la política de correo existente. Corrige la plantilla antes de agotar los intentos. No se registran su contenido ni datos personales en el error.

Puedes abrir el HTML directamente en un navegador para editar la estructura, aunque verás las variables sin sustituir y los dos bloques de evento. La revisión en navegador no sustituye comprobar el mensaje en los clientes de correo que utilicéis. Las pruebas usan Graph simulado y un SMTP local, sin enviar mensajes externos; resultados en [validación](validacion.md).
