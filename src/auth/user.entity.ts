// src/auth/user.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn } from 'typeorm';
import { Funcionario } from '../funcionarios/funcionario.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  matricula: string; // Este será o login

  @Column()
  password: string;

  @Column({ default: false })
  isAdmin: boolean;

  // Relacionamento opcional para vincular o login ao cadastro do funcionário
  @OneToOne(() => Funcionario, { nullable: true })
  @JoinColumn()
  funcionario: Funcionario;
}