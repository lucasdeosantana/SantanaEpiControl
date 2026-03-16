//src/epis/epis.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Epi } from './epi.entity';
import { CreateEpiDto } from './dto/create-epi.dto';
import { UpdateEpiDto } from './dto/update-epi.dto';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class EpisService {
  constructor(
    @InjectRepository(Epi)
    private episRepository: Repository<Epi>,
    private auditService: AuditService,
    private dataSource: DataSource, // <--- Adicionado para transações atômicas
  ) {}

  async create(createEpiDto: CreateEpiDto, usuario: string): Promise<Epi> {
    return await this.dataSource.transaction(async (manager) => {
      // Cria o EPI dentro da transação
      const epi = manager.create(Epi, createEpiDto);
      const savedEpi = await manager.save(epi);

      // Log atômico — se falhar, o save acima é revertido
      await this.auditService.createLog(
        'EPI_CRIADO',
        savedEpi,
        usuario,
        manager,
      );

      return savedEpi;
    });
  }

  async findAll(): Promise<Epi[]> {
    return this.episRepository.find({
      order: {
        created_at: 'DESC',
      },
    });
  }

  async findOne(id: number): Promise<Epi> {
    const epi = await this.episRepository.findOne({ where: { id } });
    if (!epi) {
      throw new NotFoundException(`EPI com ID ${id} não encontrado`);
    }
    return epi;
  }

  async findByCodigo(codigo: string): Promise<Epi> {
    const epi = await this.episRepository.findOne({ where: { codigo } });
    if (!epi) {
      throw new NotFoundException(`EPI com código ${codigo} não encontrado`);
    }
    return epi;
  }

  async update(id: number, updateEpiDto: UpdateEpiDto, usuario: string): Promise<Epi> {
    // Verifica existência antes da transação
    const epiExistente = await this.findOne(id);

    return await this.dataSource.transaction(async (manager) => {
      // Atualiza o EPI dentro da transação
      Object.assign(epiExistente, updateEpiDto);
      const updatedEpi = await manager.save(Epi, epiExistente);

      // Log atômico — se falhar, o save acima é revertido
      await this.auditService.createLog(
        'EPI_ATUALIZADO',
        { id, before: epiExistente, changes: updateEpiDto },
        usuario,
        manager,
      );

      return updatedEpi;
    });
  }

  async remove(id: number, usuario: string): Promise<void> {
    // Verifica existência antes da transação
    const epi = await this.findOne(id);

    await this.dataSource.transaction(async (manager) => {
      // Remove o EPI dentro da transação
      await manager.remove(Epi, epi);

      // Log atômico — se falhar, o remove acima é revertido
      await this.auditService.createLog(
        'EPI_REMOVIDO',
        epi,
        usuario,
        manager,
      );
    });
  }
}