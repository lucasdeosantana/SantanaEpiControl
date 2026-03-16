// src/audit/daily-hash.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('daily_hash_audit')
export class DailyHashAudit {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  data_referencia: string; // formato YYYY-MM-DD

  @Column()
  hash_consolidado: string;

  @Column('text', { nullable: true })
  detalhes: string; // opcional: quantos logs foram processados

  @CreateDateColumn()
  created_at: Date;
}