// src/funcionarios/funcionario.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('funcionarios')
export class Funcionario {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  nome: string;

  @Column({ unique: true })
  cpf: string;

  @Column({ unique: true })
  matricula: string;

  @Column()
  setor: string;

  @Column({ default: 'ativo' })
  status: string;

  @CreateDateColumn()
  created_at: Date;
}