# Identidad visual de DIREXIS TUSGSAL

La interfaz utiliza los colores facilitados por el usuario y comparte la misma cabecera, navegación y pie en la consulta, el alta de quejas, el resultado y la pantalla de demostración. La adaptación afecta a presentación, metadatos y navegación visual; mantiene las rutas, campos, validaciones y contratos de API existentes.

## Añadir el logo

Guarda el logo con este nombre y ubicación exactos, desde la raíz del repositorio:

```text
frontend/
  public/
    brand/
      logo-direxis-tusgsal.png
```

La carpeta ya está creada. Utiliza preferiblemente un **PNG horizontal con fondo transparente**, con buena resolución (por ejemplo, altura de 112 px o más). El logo se ajusta al espacio disponible conservando sus proporciones; no necesita dimensiones exactas ni modificaciones de código.

1. Copia la imagen a esa carpeta con el nombre `logo-direxis-tusgsal.png`.
2. Recarga la web. Si la tenías abierta y conserva la imagen anterior, usa `Ctrl + F5`.
3. La cabecera lo mostrará automáticamente en todas las páginas compartidas.

Hasta que exista el archivo, se presenta **DIREXIS TUSGSAL como texto**, sin una imagen rota visible. Ese texto es provisional y no pretende sustituir el logo oficial. La carga utiliza la ruta pública `/brand/logo-direxis-tusgsal.png`, sin optimización/caché de imágenes de Next.js. El nombre accesible y el enlace al inicio se mantienen al cambiar entre texto e imagen.

En desarrollo Docker monta `frontend/`, por lo que basta con copiar y recargar. En el modo compilado, `public/` se incorpora a la imagen: añadir o sustituir el logo requiere reconstruir y recrear el frontend, según [Docker](docker.md). No se añade un montaje ni un servicio nuevo.

## Colores y Tailwind 4

Los colores se definen una sola vez en [globals.css](../frontend/src/app/globals.css). `@theme inline` los expone como utilidades de Tailwind 4, por ejemplo `bg-brand-yellow` y `text-brand-gray`.

| Variable CSS | Valor | Uso |
| --- | --- | --- |
| `--brand-yellow` | `#f5a810` | Botones principales, acentos, navegación activa y cabecera |
| `--brand-gray` | `#64666b` | Textos secundarios, enlaces de navegación, bordes de controles y foco |
| `--brand-ink` | `#292b30` | Textos principales y texto sobre botones amarillos |
| `--brand-yellow-hover` | `#e69a08` | Respuesta al pasar el cursor por botones |
| `--brand-soft` | `#fff7e6` | Fondos suaves de secciones, enlaces y detalle |
| `--brand-canvas` | `#f6f6f4` | Fondo general neutro |
| `--brand-line` | `#dededb` | Separadores y bordes decorativos de tarjetas |

El texto de los botones amarillos es oscuro para mantener contraste. El foco usa gris y un halo suave; los errores y las confirmaciones conservan colores semánticos. La propuesta no incorpora tipografías remotas, imágenes externas ni dependencias nuevas.

Las clases compartidas `.page-shell`, `.surface-card`, `.form-input`, `.button-primary`, `.button-secondary`, `.brand-link` y `.section-eyebrow` están en `@layer components`. Permiten cambiar controles y superficies sin repetir todos sus estilos en cada página.

## Archivos para ajustar la presentación

| Archivo | Responsabilidad |
| --- | --- |
| [globals.css](../frontend/src/app/globals.css) | Paleta, tema Tailwind, foco y clases compartidas |
| [marca-corporativa.tsx](../frontend/src/components/marca-corporativa.tsx) | Ruta del logo, alternativa de texto y sección activa de navegación |
| [plant.tsx](../frontend/src/components/plant.tsx) | Composición de la cabecera y el pie |
| [layout.tsx](../frontend/src/app/layout.tsx) | Nombre de empresa en títulos y descripción |
| [page.tsx](../frontend/src/app/page.tsx) | Presentación de inicio y tarjeta de consulta |
| [formulario-queja.tsx](../frontend/src/components/formulario-queja.tsx) | Presentación del alta y su confirmación |
| [resultado-incidencia.tsx](../frontend/src/components/resultado-incidencia.tsx) | Tarjetas, detalle y encabezado de la ficha |

Las comprobaciones ejecutadas y sus límites se recogen en [validación](validacion.md). El PNG aportado por el usuario ya está incluido en `frontend/public/brand/logo-direxis-tusgsal.png`; su carga real en la cabecera se comprueba en escritorio y móvil el 9 de noviembre de 2026.
