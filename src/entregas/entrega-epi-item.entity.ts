// entrega-epi-item.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Entrega } from './entrega.entity';
import { Epi } from '../epis/epi.entity';

@Entity('entrega_epi_itens')
export class EntregaEpiItem {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Entrega, entrega => entrega.itens, { onDelete: 'CASCADE' })
  entrega: Entrega;

  @ManyToOne(() => Epi, { eager: true })
  epi: Epi;

  @Column({ type: 'int', default: 1 })
  quantidade: number;
}