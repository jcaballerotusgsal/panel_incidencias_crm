import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString, Matches, Max, MaxLength, Min } from 'class-validator';

/** Identifica una única incidencia mediante su clave y un identificador del solicitante. */
export class ConsultarIncidenciaDto {
  @ApiProperty({ description: 'id de crm_incidencia', minimum: 1, maximum: 2147483647 })
  @IsInt()
  @Min(1)
  @Max(2147483647)
  codigoIncidencia!: number;

  @ApiProperty({ description: 'DNI, correo o código AMB', maxLength: 45 })
  @IsString()
  @MaxLength(45)
  @Matches(/\S/, { message: 'El identificador no puede estar vacío.' })
  identificador!: string;
}
