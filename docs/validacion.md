# Validación de la entrega

Fecha de preparación: **14 de octubre de 2026**.

## Revisiones ejecutadas

| Comprobación | Resultado |
| --- | --- |
| Parseo de los manifiestos y configuraciones JSON | Correcto |
| Parseo YAML de los dos archivos Compose | Correcto |
| Contextos de build, targets, dependencias y montajes declarados | Coherentes en revisión estática |
| Publicación de puertos limitada a loopback | Comprobada en ambos Compose |
| Sintaxis de TypeScript/TSX mediante transpilation | Sin errores detectados |
| Sintaxis JavaScript de scripts y salida transpilada | Sin errores detectados |
| Sintaxis de los dos scripts de shell | Correcta |
| Evaluación aislada de la configuración de Next.js | Rewrite interno, standalone y polling de desarrollo comprobados |
| URL de la API en el componente de navegador | Relativa, sin nombre interno de Docker |
| Política de lockfiles | Bootstrap en desarrollo; obligatorios en builds compilados |

Se realizaron 19 comprobaciones de código/configuración ejecutable y 9 comprobaciones de manifiestos/estructura. Los detalles están en [validacion-estatica.json](validacion-estatica.json).

El analizador TypeScript disponible en el entorno de preparación era **5.8.3**. La plantilla selecciona la rama **5.9**. La revisión por transpilation detecta errores sintácticos; no equivale a un typecheck completo contra las dependencias instaladas.

## Comprobaciones pendientes en un entorno con Docker y red

No se pudieron ejecutar `npm install`, la resolución de dependencias y creación de lockfiles, la compilación real de NestJS/Next.js, ESLint con sus paquetes, las pruebas HTTP incluidas, una prueba de navegador ni la construcción/puesta en marcha de las imágenes Docker.

Motivo: el entorno de preparación no dispone del comando/motor Docker y la conexión al registro npm no estaba disponible. No se simularon esos resultados ni se incluyeron lockfiles inventados.

Por tanto, esta entrega es un **proyecto base preparado y revisado estáticamente**, no una construcción Docker verificada de extremo a extremo. El resultado definitivo de compatibilidad se comprobará al instalar las dependencias, ejecutar las pruebas y construir las imágenes en el equipo de desarrollo.

Los comandos para realizar esas pruebas están en [docker.md](docker.md) y en el README de la raíz.
