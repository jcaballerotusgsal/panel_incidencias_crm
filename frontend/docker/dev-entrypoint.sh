#!/bin/sh
# Preparar dependencias dentro de Docker y conservar el lockfile en el proyecto.
set -eu

if [ ! -f package.json ]; then
  echo "ERROR: no existe /app/package.json; comprueba el montaje del proyecto." >&2
  exit 1
fi

if [ -f package-lock.json ]; then
  echo "Instalando las versiones fijadas en package-lock.json..."
  npm ci --include=dev --no-fund
else
  echo "Primera instalación: se generará package-lock.json en esta carpeta."
  npm install --include=dev --no-fund
fi

# Sustituir el shell para facilitar la entrega de señales al proceso principal.
exec "$@"
