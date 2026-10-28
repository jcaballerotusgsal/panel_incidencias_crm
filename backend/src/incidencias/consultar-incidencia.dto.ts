import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches, MaxLength, ValidateBy } from 'class-validator';

/**
 * Acepta un id entero o su representación decimal sin convertir ni perder ceros iniciales.
 * @param value Valor externo del código, todavía sin validar.
 * @returns true para enteros de 1 a 2147483647 o cadenas de uno a diez dígitos en ese rango.
 */
function isCodigoIncidencia(value: unknown): boolean {
  if (typeof value !== 'number' && typeof value !== 'string') return false;
  if (typeof value === 'string' && !/^[0-9]{1,10}$/.test(value)) return false;
  const codigo = Number(value);
  return Number.isInteger(codigo) && codigo >= 1 && codigo <= 2147483647;
}

/** Identifica una única incidencia mediante su clave y un identificador del solicitante. */
export class ConsultarIncidenciaDto {
  @ApiProperty({
    description: 'id de crm_incidencia; se conserva el texto introducido en el log',
    oneOf: [
      { type: 'integer', minimum: 1, maximum: 2147483647 },
      { type: 'string', pattern: '^[0-9]{1,10}$', maxLength: 10 },
    ],
  })
  @ValidateBy({ name: 'isCodigoIncidencia', validator: { validate: isCodigoIncidencia } }, {
    message: 'El código de incidencia debe ser un entero de 1 a 2147483647 o una cadena decimal equivalente de hasta diez dígitos.',
  })
  codigoIncidencia!: number | string;

  @ApiProperty({ description: 'DNI, correo o código AMB', maxLength: 45 })
  @IsString()
  @MaxLength(45)
  @Matches(/\S/, { message: 'El identificador no puede estar vacío.' })
  identificador!: string;
}
