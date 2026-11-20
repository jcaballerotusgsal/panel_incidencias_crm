# Idiomas de la web

La rama `feat/multiidioma-ca-es-en` incorpora catalán (`ca`), español (`es`) e inglés (`en`) en la web. El selector de la cabecera cambia textos, etiquetas, ayudas, errores y estados conocidos sin navegar ni recargar. No se duplica la aplicación por idioma ni se cambian las rutas `/`, `/quejas/nueva`, `/incidencias/resultado` y la demostración `/incidencias`.

## Elección y recuerdo

El selector de cabecera presenta tres botones con nombres propios y banderas SVG decorativas: senyera para catalán, España para español y Reino Unido para inglés. El botón activo tiene `aria-pressed` y resaltado corporativo; los botones admiten Tab y activación con Enter/Espacio. Los nombres identifican el idioma aunque no se distinga una bandera. El diseño se adapta a móvil y no depende de emojis del sistema.

El layout del servidor resuelve la preferencia en este orden:

1. Cookie `sac_idioma` con un valor válido `ca`, `es` o `en`.
2. `Accept-Language`, respetando pesos y variantes regionales de los idiomas soportados.
3. Catalán si no hay coincidencia.

El HTML inicial, su atributo `lang` y los metadatos usan esa preferencia para evitar hidratar en un idioma distinto. Al cambiar desde el selector se actualizan el contexto, `lang` y título sin remontar el formulario ni el proveedor de consulta. La cookie conserva solo el idioma durante un año, con `Path=/`, `SameSite=Lax` y `Secure` en HTTPS. No contiene datos personales y no utiliza localStorage/sessionStorage. Si el navegador no conserva cookies, la elección no se recuerda entre visitas. Los selectores de calendario y otros controles del navegador también dependen de la configuración del navegador y del sistema operativo.

## Editar textos

Los diccionarios están en:

- `frontend/src/messages/ca.json`
- `frontend/src/messages/es.json`
- `frontend/src/messages/en.json`

Cada clave es un texto editorial en español y debe existir en los tres archivos. Para cambiar una traducción, editar su **valor**, conservando la clave. Al incorporar un mensaje nuevo, añadir la misma clave en los tres diccionarios y utilizar `t(clave)` en un componente cliente o `<Texto>clave</Texto>` en páginas de servidor. `npm run test:i18n` comprueba que tengan las mismas claves y que no existan traducciones vacías. Las claves no encontradas conservan el texto original como protección; las pruebas de navegador revisan además la cobertura visible. No se evalúa contenido de los JSON como código.

`frontend/src/lib/i18n.ts` selecciona el idioma y resuelve traducciones. `idioma-servidor.ts` lee cookie/cabeceras; `components/idioma-context.tsx` comparte el idioma y muestra el selector. Las traducciones no cambian las reglas de DNI/NIE, CP, teléfonos, fechas ni catálogos. El formulario conserva los valores y selecciones al cambiar de idioma, incluso tras un error o mientras se espera una respuesta. Se traducen mensajes de validación locales y errores recuperables de red/confirmación.

Los 400 del alta se presentan con mensajes traducibles: si el servidor informa de una línea/población no disponible, se muestra ese mensaje; otros errores se presentan mediante el aviso general de revisión de campos. No se muestran sin control textos arbitrarios del servidor en un idioma distinto. El backend conserva su contrato y su validación independiente.

## Datos del CRM

El detalle y la respuesta del gestor se muestran como texto original sin traducción automática ni cambios en MySQL. Se traducen solo las etiquetas y los estados reconocidos (`Pendiente`, `En revisión`, `Cerrada`, `Abierta` y sus variantes conocidas). Estados históricos desconocidos se conservan literalmente. El tipo `Queja` y la vía `formulario web` tienen traducciones de presentación, sin escribir esas traducciones en la base. Fechas del CRM conservan su formato de lectura y zona originales.

Esta primera fase no modifica correos, `dp_idioma`, tablas, triggers, ni el JSON del alta. El consumidor sigue utilizando su plantilla y configuración anteriores. En una fase posterior habrá que confirmar cómo conservar el idioma de la queja para los avisos de alta y cambio de estado, y el idioma del destinatario interno.

## Comprobaciones y despliegue

Desde `frontend/`, ejecutar `npm run test:i18n`, `npm run typecheck` y `npm run lint`. Las pruebas de idioma no acceden al CRM. El smoke general mantiene su aviso de escritura de log y solicita español explícitamente para comprobar sus textos.

Para PM2: distribuir los cambios, compilar frontend, copiar `public` y `.next/static` a la salida standalone como indica [pm2.md](pm2.md), y reiniciar el proceso frontend existente. No hace falta reiniciar el consumidor ni modificar SQL. El layout usa cookie/cabeceras por petición; conservar el despliegue de Next.js como servidor, sin exportación estática. Los resultados concretos están en [validacion.md](validacion.md).
