import {
  Injectable, Logger, NotFoundException, BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import * as crypto from 'crypto';
import * as fs from 'fs';
import sharp from 'sharp';
import * as path from 'path';

import { Entrega } from './entrega.entity';
import { CreateEntregaDto } from './dto/create-entrega.dto';
import { Funcionario } from '../funcionarios/funcionario.entity';
import { Epi } from '../epis/epi.entity';
import { AuditService } from '../audit/audit.service';
import { FaceDetectionService } from './services/face-detection.service';

@Injectable()
export class EntregasService {
  private readonly logger = new Logger(EntregasService.name);

  constructor(
    @InjectRepository(Entrega)
    private entregasRepository: Repository<Entrega>,
    @InjectRepository(Funcionario)
    private funcionariosRepository: Repository<Funcionario>,
    @InjectRepository(Epi)
    private episRepository: Repository<Epi>,
    private readonly auditService: AuditService,
    private readonly faceDetectionService: FaceDetectionService,
    private dataSource: DataSource,
  ) {}

  async create(
    dto: CreateEntregaDto,
    userName: string,
    fotoBuffer: Buffer,
    fotoOriginalName: string,
  ): Promise<Entrega> {
    // 1. Valida funcionário
    const funcionario = await this.funcionariosRepository.findOne({
      where: { id: dto.funcionario_id },
    });
    if (!funcionario) {
      throw new NotFoundException(`Funcionário ${dto.funcionario_id} não encontrado`);
    }

    // 2. Valida EPIs
    const epis = await this.episRepository.findByIds(dto.epis_ids);
    if (epis.length !== dto.epis_ids.length) {
      throw new BadRequestException('Um ou mais EPIs não encontrados');
    }

    // 3. Processa e salva a foto (600x600, JPEG)
    const { caminhoFoto, hashFoto } = await this.processarFoto(fotoBuffer, fotoOriginalName);

    // 4. Detecta rosto humano na foto
    const temRosto = await this.faceDetectionService.detectarRostoHumano(caminhoFoto);
    if (!temRosto) {
      // Remove a foto salva antes de lançar o erro
      fs.unlinkSync(caminhoFoto);
      throw new BadRequestException('Nenhum rosto humano detectado na foto de validação');
    }

    // 5. Cria a entrega no banco com status "processing" — tudo atômico
    return await this.dataSource.transaction(async (manager) => {
      const entrega = manager.create(Entrega, {
        funcionario,
        user_name: userName,
        epis,
        status: 'processing',
        foto: caminhoFoto,
        hash_foto: hashFoto,
      });

      const salva = await manager.save(entrega);

      await this.auditService.createLog(
        'entrega.criada',
        { id: salva.id, funcionario_id: dto.funcionario_id, epis_ids: dto.epis_ids },
        userName,
        manager,
      );

      return salva;
    });
  }

  async findAll(): Promise<Entrega[]> {
    return this.entregasRepository.find({ order: { created_at: 'DESC' } });
  }

  async findOne(id: number): Promise<Entrega> {
    const entrega = await this.entregasRepository.findOne({ where: { id } });
    if (!entrega) {
      throw new NotFoundException(`Entrega ${id} não encontrada`);
    }
    return entrega;
  }

  async findByFuncionario(funcionarioId: number): Promise<Entrega[]> {
    return this.entregasRepository.find({
      where: { funcionario: { id: funcionarioId } },
      order: { created_at: 'DESC' },
    });
  }

  // ─── Métodos internos usados pelos Workers ──────────────────────────────────

  async findPendentesProcessamento(): Promise<Entrega[]> {
    return this.entregasRepository.find({ where: { status: 'processing' } });
  }

  async findPendentesValidacao(): Promise<Entrega[]> {
    return this.entregasRepository.find({ where: { status: 'created' } });
  }

  async atualizarStatus(
    id: number,
    status: Entrega['status'],
    extras: Partial<Entrega> = {},
    usuario = 'sistema',
    erro?: string,
  ): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      await manager.update(Entrega, id, {
        status,
        erro_mensagem: erro ?? undefined,
        ...extras,
      });

      await this.auditService.createLog(
        `entrega.status.${status}`,
        { id, status, erro: erro ?? undefined, ...extras },
        usuario,
        manager,
      );
    });
  }

  // ─── Utilitários privados ───────────────────────────────────────────────────

  private async processarFoto(
    buffer: Buffer,
    originalName: string,
  ): Promise<{ caminhoFoto: string; hashFoto: string }> {
    const pasta = path.join(process.cwd(), 'uploads', 'fotos-entrega');
    if (!fs.existsSync(pasta)) {
      fs.mkdirSync(pasta, { recursive: true });
    }

    const nomeArquivo = `foto-${Date.now()}-${Math.round(Math.random() * 1e9)}.jpg`;
    const caminhoFoto = path.join(pasta, nomeArquivo);

    // Redimensiona para 600x600 e salva
    const bufferProcessado = await sharp(buffer)
      .resize({ width: 600, height: 600, fit: 'cover' })
      .jpeg({ quality: 85 })
      .toBuffer();

    fs.writeFileSync(caminhoFoto, bufferProcessado);

    // Hash SHA-256 da foto processada
    const hashFoto = crypto.createHash('sha256').update(bufferProcessado).digest('hex');

    return { caminhoFoto, hashFoto };
  }

  calcularHashArquivo(caminho: string): string {
    const buffer = fs.readFileSync(caminho);
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }
}
