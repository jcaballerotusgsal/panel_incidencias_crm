# Pendientes de datos

- Verificar de nuevo procedencia, esquema y permisos si se cambia la copia local o el destino de conexión; esta revisión no autoriza producción.
- La revisión local del 28 de octubre de 2026 confirmó que la cuenta del backend ya dispone de `INSERT` en la tabla de logs; no se modificaron usuarios ni concesiones. Como objetivo de privilegios mínimos, limitar `SELECT` a `crm_incidencia` y `crm_lineas_tusgsal_amb` e `INSERT` a `crm_logs_consulta_incidencias`; la cuenta local conserva permisos más amplios heredados, cuya reducción requiere una actuación específica.
- Definir autenticación, autorización y límites de petición antes de habilitar esta vista con datos personales fuera del desarrollo local. Reducir las columnas públicas cuando se sustituya la salida provisional.
- Precisar el uso histórico de `dp_apellidos` como código AMB antes de ampliar reglas o efectuar escrituras. No se renombra ni transforma el campo.
- Completar el inventario del esquema y de vistas si se necesitan nuevos dominios. No existe aquí una instantánea completa verificada del CRM.
- Definir conservación y acceso a los logs antes de ampliar su uso; contienen el DNI, correo o código AMB recibido. El endpoint actual solo escribe y no permite listarlos.
