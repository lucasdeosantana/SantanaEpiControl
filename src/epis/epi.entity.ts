// src/epis/epi.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('epis')
export class Epi {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  codigo: string;

  @Column()
  descricao: string;

  @Column({ nullable: true })
  ca: string;

  @Column()
  fabricante: string;

  @Column()
  tipo: string;

  @Column({ nullable: true })
  imagem: string;

  @Column({ type: 'text', nullable: true })
  observacao: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
} 