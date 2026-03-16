// src/audit/audit-log.entity.ts
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('audit_log')
export class AuditLog {
  @PrimaryGeneratedColumn()
  id: number;

  // vamos setar manualmente o timestamp para poder usá-lo no hash
  @Column({ type: 'datetime' })
  timestamp: Date;

  @Column()
  evento: string;

  // armazenamos o JSON como texto
  @Column('text')
  dados: string;

  @Column({ nullable: false })
  hash_anterior: string;

  @Column({ nullable: false })
  hash_atual: string;

  @Column()
  usuario: string;
}