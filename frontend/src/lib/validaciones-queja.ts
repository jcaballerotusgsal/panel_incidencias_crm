/**
 * Valida los campos personales antes de enviar; la API vuelve a comprobar todos los datos.
 * @param campo Nombre del campo del formulario. @param entrada Texto sin normalizar del usuario.
 * @returns Mensaje de corrección o cadena vacía; no comprueba existencia de buzones ni domicilios.
 */
export function validarCampoQueja(campo: string, entrada: string): string {
  const valor = entrada.trim();
  if (['nombre', 'apellidos'].includes(campo)) {
    if (!valor) return campo === 'nombre' ? 'El nombre es obligatorio.' : 'Los apellidos son obligatorios.';
    if (valor.length > 45 || !/\p{L}/u.test(valor) || !/^[\p{L}\p{M} .’'·-]+$/u.test(valor)) {
      return 'Utiliza letras y puntuación habitual, sin números, con un máximo de 45 caracteres.';
    }
  }
  if (campo === 'dni') {
    const documento = valor.toUpperCase();
    if (!documento) return 'El DNI o NIE es obligatorio.';
    const numero = documento.slice(0, -1).replace(/^[XYZ]/, letra => String('XYZ'.indexOf(letra)));
    if (!/^(?:\d{8}|[XYZ]\d{7})[A-Z]$/.test(documento)
      || 'TRWAGMYFPDXBNJZSQVHLCKE'[Number(numero) % 23] !== documento.at(-1)) {
      return 'Introduce un DNI o NIE con formato y letra de control válidos.';
    }
  }
  if (campo === 'correo' && (!valor || valor.length > 45 || !/^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/.test(valor)
    || valor.split('@')[0].includes('..'))) return 'Introduce un correo electrónico válido, de hasta 45 caracteres.';
  if (campo === 'codigoPostal' && valor && !/^(?:0[1-9]|[1-4]\d|5[0-2])\d{3}$/.test(valor)) {
    return 'Introduce un código postal español de cinco cifras (provincia 01–52).';
  }
  if (campo === 'telefono' && valor && (valor.length > 45 || !/^\+?[\d ().-]+$/.test(valor)
    || !/^(?:[6-9]\d{8}|\+[1-9]\d{7,14})$/.test(valor.replace(/[ ().-]/g, '')))) {
    return 'Introduce nueve cifras para un teléfono español o + y entre 8 y 15 cifras para uno internacional.';
  }
  if (campo === 'direccion' && valor && (valor.length > 1000 || !/[\p{L}\p{N}]/u.test(valor) || /[<>\p{Cc}]/u.test(valor))) {
    return 'Introduce una dirección con letras o números, sin etiquetas ni saltos de línea (máximo 1000 caracteres).';
  }
  return '';
}
