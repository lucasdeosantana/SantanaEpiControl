// src/funcionarios/dto/create-funcionario.dto.ts
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateFuncionarioDto {
  @IsString()
  @IsNotEmpty()
  nome: string;

  @IsString()
  @IsNotEmpty()
  cpf: string;

  @IsString()
  @IsNotEmpty()
  matricula: string;

  @IsString()
  @IsNotEmpty()
  setor: string;

  @IsString()
  @IsOptional()
  status?: string;
}