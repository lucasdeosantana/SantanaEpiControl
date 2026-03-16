// src/epis/dto/create-epi.dto.ts
import { IsString, IsOptional, IsNotEmpty } from 'class-validator';

export class CreateEpiDto {
  @IsString()
  @IsNotEmpty()
  codigo: string;

  @IsString()
  @IsNotEmpty()
  descricao: string;

  @IsString()
  @IsOptional()
  ca?: string;

  @IsString()
  @IsNotEmpty()
  fabricante: string;

  @IsString()
  @IsNotEmpty()
  tipo: string;

  @IsString()
  @IsOptional()
  imagem?: string;

  @IsString()
  @IsOptional()
  observacao?: string;
}