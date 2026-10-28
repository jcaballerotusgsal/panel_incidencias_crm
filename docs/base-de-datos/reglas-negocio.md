# Reglas de la consulta provisional

Confirmadas por la petición del usuario el **23 de octubre de 2026**:

1. El código de incidencia corresponde a `crm_incidencia.id`.
2. El segundo campo puede coincidir con `dp_dni`, `dp_email` o `dp_apellidos`; este último contiene el código AMB en los casos indicados por el usuario.
3. Deben coincidir simultáneamente el id y al menos uno de esos tres campos. No se busca solo por datos personales ni se ofrecen listados por identificador.
4. La API devuelve las 28 columnas de una incidencia más `nom_linea_tusgsal`. La ficha muestra 20 campos con etiquetas legibles, organizados por incidencia, contacto, acontecimiento, detalle y fechas. Por petición del usuario se omiten de la presentación `nombre_corto`, `e_matricula`, `e_conductor`, `e_fecha`, `e_tempo`, `dp_sexo`, `dp_idioma` y `atendido_por`. Esta selección visual no elimina los campos de la respuesta API. Sin coincidencia, muestra «No se han encontrado los datos».
5. «Línea» muestra `crm_lineas_tusgsal_amb.nom_linea_tusgsal` mediante la correspondencia `crm_incidencia.m_linea = crm_lineas_tusgsal_amb.id_linea_amb`. El id `m_linea` se conserva en la API, pero la ficha presenta el nombre. Sin id, sin correspondencia o sin nombre, se mantiene la incidencia y «Línea» muestra «No informado».

La vista presenta fechas como día/mes/año, conservando la hora original si existe y sin conversiones de zona horaria. Los valores nulos, ausentes o vacíos se presentan como «No informado»; los ceros se conservan. El detalle se muestra como texto con sus saltos de línea, sin interpretar HTML. No se renderizan automáticamente campos nuevos de la API: deben incorporarse expresamente a la ficha.

La entrada exige un entero positivo hasta 2147483647 o su representación de uno a diez dígitos, y un identificador no vacío de hasta 45 caracteres. El formulario conserva ambos textos en el envío y el log. Para la búsqueda se convierte el código a número y se recortan los extremos del identificador; el SQL aplica `TRIM` a los tres campos para tolerar espacios de relleno observados en la copia local. Se conserva el contenido original de la respuesta. No se eliminan espacios interiores, guiones ni puntos, no se hacen búsquedas parciales y no se adivina el tipo de identificador por su formato.

La comparación de código e identificador es el criterio de acceso provisional de esta pantalla local. No constituye una sesión de usuario del CRM ni permisos generales del backoffice. No se deducen reglas de autenticación, estados válidos o reglas de escritura sobre los registros originales. La petición del **28 de octubre de 2026** autoriza únicamente añadir el registro de cada consulta en la nueva tabla de logs, según [logs-consultas.md](logs-consultas.md): `Valida` es 1 con incidencia y 0 sin ella, y se espera la confirmación del log antes de responder.
