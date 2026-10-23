# Pendientes de datos

- Verificar de nuevo procedencia, esquema y permisos si se cambia la copia local o el destino de conexión; esta revisión no autoriza producción.
- Revisar los permisos efectivos del usuario configurado y utilizar una cuenta con `SELECT` limitado a `crm_incidencia` y `crm_lineas_tusgsal_amb`. El módulo solo ejecuta lecturas; no se han cambiado usuarios ni concesiones de MySQL.
- Definir autenticación, autorización y límites de petición antes de habilitar esta vista con datos personales fuera del desarrollo local. Reducir las columnas públicas cuando se sustituya la salida provisional.
- Precisar el uso histórico de `dp_apellidos` como código AMB antes de ampliar reglas o efectuar escrituras. No se renombra ni transforma el campo.
- Completar el inventario del esquema y de vistas si se necesitan nuevos dominios. No existe aquí una instantánea completa verificada del CRM.
