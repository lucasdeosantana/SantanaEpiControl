import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  ManyToOne, OneToMany, JoinTable, JoinColumn,
} from 'typeorm';
import { Funcionario } from '../funcionarios/funcionario.entity';
import { EntregaEpiItem } from './entrega-epi-item.entity'

export type EntregaStatus = 'processing' | 'created' | 'validated' | 'error';

@Entity('entregas')
export class Entrega {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Funcionario, { eager: true })
  @JoinColumn({ name: 'funcionario_id' })
  funcionario: Funcionario;

  @Column()
  user_name: string;

  @OneToMany(() => EntregaEpiItem, item => item.entrega, { cascade: true, eager: true })
  itens: EntregaEpiItem[];

  @Column({ nullable: true })
  arquivo_pdf: string;

  @Column({ default: 'processing' })
  status: EntregaStatus;

  @Column({ nullable: true })
  foto: string;

  @Column({ nullable: true })
  hash_foto: string;

  @Column({ nullable: true })
  arquivo_timestamp: string;

  @Column({ nullable: true })
  hash_pdf: string;

  @Column({ nullable: true })
  erro_mensagem: string;

  @CreateDateColumn()
  created_at: Date;
}
