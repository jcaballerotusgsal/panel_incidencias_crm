import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, type TransformFnParams } from 'class-transformer';
import { IsEmail, IsInt, IsNotEmpty, IsOptional, IsString, Matches, Max, MaxLength, Min, ValidateBy } from 'class-validator';
import { isFechaSuceso } from './validaciones';

/**
 * Recorta extremos solo en cadenas, sin convertir objetos, números ni nulos a texto.
 * @param parameters Valor externo que proporciona class-transformer.
 * @returns Cadena recortada o valor original para que el validador rechace tipos incorrectos.
 */
function recortarTexto(parameters: TransformFnParams): unknown {
  const value: unknown = parameters.value;
  return typeof value === 'string' ? value.trim() : value;
}

/** Datos del formulario; ids generados, estados, canal y fechas de recepción pertenecen al servidor. */
export class CrearQuejaDto {
  @ApiProperty({ maxLength: 45 })
  @Transform(recortarTexto)
  @IsString()
  @IsNotEmpty({ message: 'El nombre es obligatorio.' })
  @MaxLength(45)
  nombre!: string;

  @ApiProperty({ maxLength: 45 })
  @Transform(recortarTexto)
  @IsString()
  @IsNotEmpty({ message: 'Los apellidos son obligatorios.' })
  @MaxLength(45)
  apellidos!: string;

  @ApiPropertyOptional({ type: String, maxLength: 1000, nullable: true })
  @IsOptional()
  @Transform(recortarTexto)
  @IsString()
  @MaxLength(1000)
  direccion?: string | null;

  @ApiPropertyOptional({ type: String, maxLength: 20, nullable: true })
  @IsOptional()
  @Transform(recortarTexto)
  @IsString()
  @MaxLength(20)
  codigoPostal?: string | null;

  @ApiPropertyOptional({ type: String, maxLength: 45, nullable: true })
  @IsOptional()
  @Transform(recortarTexto)
  @IsString()
  @MaxLength(45)
  telefono?: string | null;

  @ApiProperty({ maxLength: 45, format: 'email' })
  @Transform(recortarTexto)
  @IsString()
  @IsEmail({}, { message: 'El correo electrónico debe ser válido.' })
  @MaxLength(45)
  correo!: string;

  @ApiPropertyOptional({ type: String, maxLength: 10, nullable: true })
  @IsOptional()
  @Transform(recortarTexto)
  @IsString()
  @MaxLength(10)
  dni?: string | null;

  @ApiProperty({ example: '30-10-2026', description: 'Fecha real del suceso, en formato dd-mm-aaaa.' })
  @Transform(recortarTexto)
  @ValidateBy({ name: 'isFechaSuceso', validator: { validate: isFechaSuceso } }, {
    message: 'La fecha del suceso debe ser válida y tener el formato dd-mm-aaaa.',
  })
  fecha!: string;

  @ApiProperty({ example: '14:30', pattern: '^([01][0-9]|2[0-3]):[0-5][0-9]$' })
  @Transform(recortarTexto)
  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'La hora debe tener el formato hh:mm entre 00:00 y 23:59.' })
  hora!: string;

  @ApiProperty({ description: 'id_linea_amb existente en el catálogo, enviado como número entero.' })
  @IsInt()
  @Min(-2147483648)
  @Max(2147483647)
  linea!: number;

  @ApiPropertyOptional({ type: Number, nullable: true, description: 'id_m_zona de una población disponible; omitido o null conserva la zona sin especificar.' })
  @IsOptional()
  @IsInt()
  @Min(-2147483648)
  @Max(2147483647)
  zona?: number | null;

  @ApiPropertyOptional({ type: String, maxLength: 45, nullable: true })
  @IsOptional()
  @Transform(recortarTexto)
  @IsString()
  @MaxLength(45)
  numeroVehiculo?: string | null;

  @ApiPropertyOptional({ type: String, maxLength: 1000, nullable: true })
  @IsOptional()
  @Transform(recortarTexto)
  @IsString()
  @MaxLength(1000)
  lugar?: string | null;

  @ApiPropertyOptional({ type: String, maxLength: 80, nullable: true })
  @IsOptional()
  @Transform(recortarTexto)
  @IsString()
  @MaxLength(80)
  parada?: string | null;

  @ApiPropertyOptional({ type: String, maxLength: 80, nullable: true })
  @IsOptional()
  @Transform(recortarTexto)
  @IsString()
  @MaxLength(80)
  sentido?: string | null;

  @ApiPropertyOptional({ type: String, maxLength: 20000, nullable: true })
  @IsOptional()
  @Transform(recortarTexto)
  @IsString()
  @MaxLength(20000)
  motivo?: string | null;
}
