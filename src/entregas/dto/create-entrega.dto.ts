import { IsArray, IsInt, IsNotEmpty, IsString } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class CreateEntregaDto {
  @IsInt()
  @IsNotEmpty()
  funcionario_id: number;

  @IsArray()
  @IsString()
  @IsInt({ each: true })
  @Type(() => Number)
  itens: { epi_id: number; quantidade: number }[];
} 
