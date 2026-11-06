# Cola de notificaciones y trigger de estado

Ampliación autorizada por el usuario el **4 de noviembre de 2026**: registrar avisos de alta web y de cambios de estado del CRM PHP mediante trigger. Se crea una tabla auxiliar y un trigger; no se alteran columnas, relaciones, índices ni estados de las tablas originales.

## Procedencia y aplicación manual

Antes de aplicar los SQL se verificaron en la copia local `db`: MySQL **5.7.21**, `crm_incidencia` y `crm_expediente` InnoDB, ausencia de la nueva tabla y de triggers sobre `crm_expediente`, y binlog desactivado. La cuenta de la API no tiene permiso para crear la tabla; el intento se rechazó sin crear objetos. Se aplicaron los dos SQL manualmente con la cuenta administradora local, sin modificar concesiones de permisos. No se ejecutó ningún volcado ni se accedió a producción.

Scripts, en este orden:

1. [002-crear-notificaciones-correo.sql](../../backend/sql/002-crear-notificaciones-correo.sql).
2. [003-trigger-notificaciones-estado.sql](../../backend/sql/003-trigger-notificaciones-estado.sql).

No contienen DROP ni reemplazan objetos existentes; repetirlos requiere revisar el destino, no ignorar errores. En otro entorno, revisar antes versión, motores, columnas, triggers existentes, permisos TRIGGER y definidor, y configuración del binlog. El script no fija un DEFINER: MySQL usa la cuenta que lo aplica. No se modifica el definidor histórico `atlas` de las vistas. No hay sincronización ni migraciones automáticas.

La API necesita `INSERT` sobre la cola además de sus permisos previos. El consumidor necesita `SELECT` y `UPDATE` sobre ella; el trigger necesita leer `crm_incidencia.dp_email` e insertar en la cola bajo los privilegios de su definidor. La cuenta de ejecución no necesita CREATE ni TRIGGER. Las pruebas locales verifican las operaciones con los permisos existentes, sin conceder privilegios nuevos. Esto no certifica otros despliegues.

## crm_notificaciones_correo

InnoDB, `utf8mb4_unicode_ci`. Fechas DATETIME escritas explícitamente con `UTC_TIMESTAMP()`, sin alterar la zona de las tablas originales. No se reinterpretan los campos de recepción de Europe/Madrid.

| Columnas | Significado |
| --- | --- |
| `id` | INT autoincremental, clave primaria de la fila por destinatario |
| `evento_id` | UUID compartido por los dos avisos del mismo evento, ASCII con comparación binaria |
| `tipo_evento` | `queja_creada` o `estado_cambiado` |
| `id_incidencia`, `id_expediente` | Referencias lógicas a los ids que originan el evento |
| `estado_anterior`, `estado_nuevo` | VARCHAR(20) nullable, capturados al producirse el evento; no se impone vocabulario al CRM |
| `tipo_destinatario` | `solicitante` o `interno` |
| `destinatario` | Correo capturado; NULL interno hasta primera reserva, o NULL si un registro histórico carece de correo |
| `estado_envio` | `pendiente`, `procesando`, `enviado` o `fallido`; vocabulario exclusivo de esta cola |
| `intentos` | Número de reservas realizadas |
| `disponible_en`, `creado_en` | Instante de reintento disponible y de generación, obligatorios |
| `reservado_hasta`, `token` | Caducidad y propiedad de la reserva activa, nullable |
| `enviado_en` | Aceptación por el proveedor, nullable; no acredita entrega |
| `ultimo_error` | Código seguro del fallo; no almacena respuestas externas ni datos personales |

Hay unicidad por `(evento_id, tipo_destinatario)` e índices para pendientes, reservas caducadas y orden por incidencia/destinatario. La relación de ids es **lógica**, no una FK añadida: el registro conserva el evento sin imponer nuevas dependencias a las tablas del CRM. Una incidencia puede tener varios expedientes y muchos eventos; cada evento genera dos filas, no una fila por incidencia.

## Generación y transacciones

El alta web inserta ambos avisos después del expediente y antes de COMMIT, con estado `Pendiente`. El UUID procede del backend; el destinatario solicitante es el correo validado del formulario. Un fallo de cualquiera de estos INSERT revierte también las tres filas del alta.

El trigger `crm_expediente_notificar_estado_au`, AFTER UPDATE por fila, compara `OLD.estado` y `NEW.estado` mediante igualdad segura ante NULL (`<=>`) y la intercalación existente. No actúa si el estado sigue siendo equivalente, aunque cambien otras columnas; los cambios solo de mayúsculas siguen la comparación de esa intercalación. Si cambia y existe `NEW.id_incidencia`, usa un UUID nuevo, captura estados anterior/nuevo, lee el correo de esa incidencia e inserta los dos avisos. Un UPDATE de varias filas puede producir varios eventos. No se consulta `crm_respuesta.estado` ni se deduce un estado global entre expedientes.

El trigger no cubre INSERT/DELETE de expedientes, cambios solo de `id_incidencia`, altas de otros programas ni `crm_respuesta.estado`. No se reconstruyen ni notifican cambios históricos anteriores a su instalación. No realiza llamadas de red; su escritura es parte de la misma transacción del CRM. Si falla, falla el UPDATE. La documentación operativa está en [notificaciones-correo.md](../notificaciones-correo.md).

## Reservas y datos personales

El consumidor usa SELECT limitado con FOR UPDATE, compatible con MySQL 5.7; no utiliza SKIP LOCKED. Reserva una fila mediante token y caducidad de dos minutos, confirma la transacción y después contacta con el proveedor. La aceptación y los errores se actualizan condicionando por id/token para no sobrescribir otra reserva. Los intentos agotados quedan fallidos. La configuración incluye un único consumidor por defecto; un fallo de bloqueo se reintenta en el siguiente ciclo.

La cola contiene el correo necesario para enviar; no almacena DNI, nombres ni texto de la queja, y no se expone mediante API pública. No tiene purga automática. Definir conservación y acceso administrativo antes de ampliar su uso.

Las pruebas locales usan altas sintéticas y ROLLBACK: verifican los dos avisos, estados iguales/cambiados/NULL, reversión, reservas, reintentos, recuperación y protección por token. No quedan filas de prueba persistidas; las secuencias autoincrementales pueden avanzar.
