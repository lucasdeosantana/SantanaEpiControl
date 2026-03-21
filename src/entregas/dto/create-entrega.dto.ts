import { IsArray, IsInt, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateEntregaDto {
  @IsInt()
  @IsNotEmpty()
  funcionario_id: number;

  @IsArray()
  @IsInt({ each: true })
  @Type(() => Number)
  epis_ids: number[];
}
