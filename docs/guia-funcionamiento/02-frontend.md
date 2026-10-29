# 02 · Cómo funciona el frontend

El frontend convierte una acción de la persona en una petición y convierte una respuesta de la API en una pantalla. Su código está dentro de `frontend/`.

## Páginas y rutas de Next.js

Este proyecto usa el directorio `src/app/`. Un `page.tsx` define la pantalla de la carpeta donde se encuentra; un `layout.tsx` envuelve las páginas que cuelgan de él. Un `route.ts` puede responder a HTTP directamente, sin una pantalla React.

| Archivo | Ruta o responsabilidad |
| --- | --- |
| [app/layout.tsx](../../frontend/src/app/layout.tsx) | Documento HTML en español, estilos y proveedor compartido de la consulta |
| [app/page.tsx](../../frontend/src/app/page.tsx) | `/`: cabecera, formulario de consulta y pie |
| [app/incidencias/resultado/page.tsx](../../frontend/src/app/incidencias/resultado/page.tsx) | `/incidencias/resultado`: página que contiene la ficha |
| [app/incidencias/page.tsx](../../frontend/src/app/incidencias/page.tsx) | `/incidencias`: ejemplo con tres incidencias ficticias |
| [app/health/route.ts](../../frontend/src/app/health/route.ts) | `GET /health`: comprueba el servidor Next.js |

Los archivos `.tsx` no son direcciones que el navegador deba solicitar. Next.js transforma esta organización de carpetas en rutas como `/` o `/incidencias/resultado`.

## Componentes de servidor y de cliente

Las páginas de inicio y resultado no llevan `'use client'`: componen la estructura desde el servidor. Incluyen componentes que sí necesitan ejecutarse con interacción en el navegador, como el formulario y la ficha que lee el estado compartido.

`'use client'` identifica esa frontera de interacción: permite usar estado, eventos y hooks de React. No significa que la página carezca de HTML inicial generado por Next.js. La *hidratación* es el paso en que React conecta ese HTML con los eventos y el estado en el navegador.

Un componente recibe información mediante *props*, sus parámetros. Por ejemplo, en [incidencias-listado.tsx](../../frontend/src/components/incidencias-listado.tsx), la página pasa la lista ficticia en la prop `incidencias`. El componente filtra esa lista localmente; no hace una consulta SQL ni una llamada a la API.

## El formulario de consulta, paso a paso

Abre [consulta-incidencia-form.tsx](../../frontend/src/components/consulta-incidencia-form.tsx). El componente `ConsultaIncidenciaForm` contiene la presentación y el manejador `consultar`.

1. Los `input` tienen los nombres `codigoIncidencia` e `identificador`. `FormData` utiliza esos atributos `name` para recoger lo escrito al enviar.
2. `event.preventDefault()` cancela la navegación HTML habitual del formulario. La función puede así hacer el POST con `fetch` y decidir qué pantalla mostrar.
3. Se comprueba que el código esté en el rango permitido y que el identificador no esté vacío. Los atributos `required`, `pattern` y `maxLength` añaden comprobaciones del navegador.
4. `setResultado(null)` borra cualquier resultado anterior. Los estados locales `pending` y `error` controlan el botón «Consultando…» y el mensaje de error.
5. `fetch` envía los textos originales como JSON. `AbortSignal.timeout(10000)` limita la espera de esta petición a diez segundos.
6. Un 200 se valida con `isConsultaResponse`; un 404 se convierte en el estado `no-encontrada`. Ambos casos navegan con `router.push('/incidencias/resultado')`.
7. Un 400, 503, error de red o respuesta inesperada mantiene el formulario visible y muestra un mensaje para poder reintentar. `finally` libera el estado de espera.

Estos inputs se leen al enviar mediante `FormData`: no guardan cada pulsación en un `useState`. En cambio, `pending` y `error` sí son estado de React. Cada llamada a sus setters hace que React vuelva a calcular qué debe mostrarse.

La validación del navegador mejora la experiencia, pero el backend vuelve a validar porque cualquier cliente puede llamar directamente a la API. El contrato autoritativo de entrada está en el DTO del backend, explicado en el [capítulo 03](03-backend.md).

## Dónde se conserva el resultado

[consulta-incidencia-context.tsx](../../frontend/src/components/consulta-incidencia-context.tsx) crea un contexto de React. Su proveedor, `ConsultaIncidenciaProvider`, envuelve las páginas desde `layout.tsx`; así el formulario y la ficha pueden acceder al mismo resultado sin incluirlo en la URL.

El hook `useConsultaIncidencia()` permite leer `resultado` y cambiarlo con `setResultado`. El valor tiene tres posibilidades:

| Valor | Significado y presentación |
| --- | --- |
| `null` | No hay consulta en memoria; se pide volver al formulario |
| `{ estado: 'no-encontrada' }` | La API respondió 404; se muestra que no se encontraron datos |
| `{ estado: 'encontrada', incidencia: ... }` | Se muestra la ficha de la incidencia recibida |

Al navegar con Next.js se conserva el proveedor del layout y su memoria. Al recargar completamente se pierde el estado: la ficha no vuelve a consultar por su cuenta. Tampoco hay fila guardada en `localStorage`, `sessionStorage` o cookies. Esto explica por qué abrir directamente la URL del resultado no muestra una incidencia anterior.

## Tipos y comprobación del JSON

[lib/incidencias.ts](../../frontend/src/lib/incidencias.ts) declara los tipos `Incidencia` y `ResultadoConsulta`. También implementa `isConsultaResponse`, que comprueba datos en tiempo de ejecución: objeto, id entero positivo, nombre de línea, lista de estados y valores escalares en las demás propiedades.

El valor de `response.json()` se recibe como `unknown`, porque procede de fuera del programa. Una declaración TypeScript no garantiza que el servidor haya enviado el formato correcto. Esta comprobación evita conservar o presentar una estructura que el componente no sabe manejar; no exige por sí sola la presencia de las 30 propiedades originales.

## Cómo se construye la ficha

[resultado-incidencia.tsx](../../frontend/src/components/resultado-incidencia.tsx) contiene la lista explícita `grupos`, el formato `mostrarValor` y el componente de presentación. No recorre automáticamente todas las claves del JSON.

Presenta el id y el detalle, y distribuye el resto de los 21 campos visibles en información de la incidencia, contacto, acontecimiento y fechas del registro. `nom_linea_tusgsal` se muestra como «Línea» en lugar de `m_linea`. Los estados repetidos se agrupan solo en la presentación; la API conserva la lista original.

`mostrarValor` representa ausencias como «No informado», mantiene el valor cero, presenta fechas como día/mes/año conservando la hora y no convierte zonas horarias. Para estados, una lista vacía muestra «Sin expediente»; varios textos distintos se separan con ` · `. Las fechas de registro no implican que MySQL las actualice automáticamente.

El contenido del detalle se inserta como texto de React, sin interpretar HTML. Ocultar campos en esta ficha no los elimina de la respuesta API: los ocho campos excluidos siguen documentados en [reglas de negocio](../base-de-datos/reglas-negocio.md).

## Estilos y archivos auxiliares

Las clases de Tailwind, como `p-6`, `rounded-2xl` o `sm:grid-cols-2`, describen espaciado, bordes y adaptación al ancho de pantalla. El prefijo `sm:` aplica la variante desde ese punto de ruptura. `globals.css` importa Tailwind y define reglas comunes; PostCSS usa `@tailwindcss/postcss`, la integración de Tailwind 4.

El alias `@/` equivale a `frontend/src/`, según [tsconfig.json](../../frontend/tsconfig.json). La cabecera y el pie compartidos están en [plant.tsx](../../frontend/src/components/plant.tsx). [ApiStatus](../../frontend/src/components/api-status.tsx) es un componente de ejemplo que comprueba `/api/health` mediante `useEffect`; se conserva en el repositorio, pero la página inicial actual no lo incluye.

[← Visión general](01-vision-general.md) · [Siguiente: backend →](03-backend.md)
