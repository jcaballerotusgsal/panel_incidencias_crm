# Pendientes de datos

- Verificar de nuevo procedencia, esquema y permisos si se cambia la copia local o el destino de conexión; esta revisión no autoriza producción.
- Las revisiones locales confirman los permisos existentes para consulta, logs y alta sin modificar usuarios ni concesiones. Como objetivo de privilegios mínimos, cubrir `SELECT` en incidencias, líneas, poblaciones y estados de expedientes, e `INSERT` en logs y las tres tablas del alta. La cuenta local conserva permisos más amplios heredados, cuya reducción requiere una actuación específica.
- Definir autenticación, autorización y límites de petición antes de habilitar esta vista con datos personales fuera del desarrollo local. Reducir las columnas públicas cuando se sustituya la salida provisional.
- Precisar el formato completo del código AMB si se requieren restricciones adicionales: la petición del 2 de noviembre solo confirma el prefijo QU para habilitar su comparación con `dp_apellidos`. El alta guarda los apellidos del formulario sin convertirlos a AMB; no se renombra ni transforma el contenido histórico.
- Completar el inventario del esquema y de vistas si se necesitan nuevos dominios. No existe aquí una instantánea completa verificada del CRM.
- Definir conservación y acceso a los logs antes de ampliar su uso; contienen el DNI, correo o código AMB recibido. El endpoint actual solo escribe y no permite listarlos.
- La v2 ya guarda Lugar como prefijo de `m_detalle` y usa el id del catálogo de poblaciones en `m_zona`. Mantener esa distinción: no convertir el texto libre de Lugar en una zona ni actualizar detalles históricos automáticamente.
- Antes de exponer el alta fuera de la copia local, definir autenticación, límites y tratamiento de reintentos: actualmente no hay idempotencia entre peticiones distintas ni envío de correo.
