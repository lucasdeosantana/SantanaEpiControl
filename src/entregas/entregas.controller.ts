import {
  Controller, Post, Get, Param, UseGuards,
  UseInterceptors, UploadedFile, Body, Request,
  BadRequestException, ParseIntPipe, Query, Res,
  NotFoundException
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { EntregasService } from './entregas.service';
import { CreateEntregaDto } from './dto/create-entrega.dto';
import { PaginationDto } from '../common/dto/pagination.dto'
import * as path from 'path';
import * as fs from 'fs';
import type { Response as ExpressResponse } from 'express';
const archiver = require('archiver');
import { AdminGuard } from '../funcionarios/guards/admin.guard';

@Controller('entregas')
@UseGuards(JwtAuthGuard)
export class EntregasController {
  constructor(private readonly entregasService: EntregasService) { }

  @Post()
  @UseInterceptors(FileInterceptor('foto', { storage: memoryStorage() }))
  async create(
    @UploadedFile() foto: Express.Multer.File,
    @Body() dto: CreateEntregaDto,
    @Request() req,
  ) {
    if (!foto) {
      throw new BadRequestException('Foto de validação é obrigatória');
    }
    return this.entregasService.create(
      dto,
      req.user,
      foto.buffer,
      foto.originalname,
    );
  }

  @Get()
  findAll(@Query() pagination: PaginationDto) {
    return this.entregasService.findAll(pagination);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.entregasService.findOne(id);
  }
  @Get('funcionario')
  findtheFuncionario(@Request() req) {
    return this.entregasService.findByFuncionario(req.user.userId);
  }

  @Get('funcionario/:funcionarioId')
  findByFuncionario(@Param('funcionarioId', ParseIntPipe) funcionarioId: number) {
    return this.entregasService.findByFuncionario(funcionarioId);
  }
  // -------------------------------------------------------
  // GET /entregas/:id/pdf/view  → serve o PDF inline
  // -------------------------------------------------------
  @Get(':id/pdf/view')
  async viewPdf(
    @Param('id', ParseIntPipe) id: number,
    @Res() res: ExpressResponse,
  ) {
    const entrega = await this.entregasService.findOne(id);

    if (!entrega?.arquivo_pdf) {
      throw new NotFoundException('PDF não encontrado para esta entrega.');
    }

    // arquivo_pdf guarda o caminho absoluto ou relativo ao projeto
    const filePath = path.resolve(entrega.arquivo_pdf);

    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('Arquivo PDF não encontrado no disco.');
    }

    const stat = fs.statSync(filePath);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="entrega-${id}.pdf"`);
    res.setHeader('Content-Length', String(stat.size)); // string para evitar TS2345
    res.setHeader('Cache-Control', 'no-store');

    // Stream direto para o response (não carrega tudo na memória)
    const stream = fs.createReadStream(filePath);
    stream.pipe(res as any); // cast necessário: NodeJS.WritableStream vs Express Response

    stream.on('error', (err) => {
      if (!res.headersSent) {
        res.status(500).json({ message: 'Erro ao ler o arquivo.', error: err.message });
      }
    });
  }
  // -------------------------------------------------------
  // GET /entregas/:id/extrair  → ZIP com PDF + Foto + OTS
  // -------------------------------------------------------
  @Get(':id/extrair')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async extrairZip(
    @Param('id', ParseIntPipe) id: number,
    @Res() res: ExpressResponse,
  ) {
    const entrega = await this.entregasService.findOne(id);

    // Monta lista de arquivos a incluir no ZIP
    const arquivos: { caminho: string; nomeNoZip: string }[] = [];

    if (entrega?.arquivo_pdf) {
      const p = path.resolve(entrega.arquivo_pdf);
      if (fs.existsSync(p)) arquivos.push({ caminho: p, nomeNoZip: `entrega-${id}.pdf` });
    }

    if (entrega?.foto) {
      const p = path.resolve(entrega.foto);
      if (fs.existsSync(p)) {
        const ext = path.extname(entrega.foto) || '.jpg';
        arquivos.push({ caminho: p, nomeNoZip: `foto-funcionario${ext}` });
      }
    }

    if (entrega?.arquivo_timestamp) {
      const p = path.resolve(entrega.arquivo_timestamp);
      if (fs.existsSync(p)) arquivos.push({ caminho: p, nomeNoZip: `timestamp-${id}.ots` });
    }

    if (arquivos.length === 0) {
      throw new NotFoundException('Nenhum arquivo encontrado para esta entrega.');
    }

    // Headers para download do ZIP
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="entrega-${id}.zip"`);
    res.setHeader('Cache-Control', 'no-store');

    // Cria o arquivo ZIP em memória e faz pipe direto para o response
    archiver
    const archive = archiver('zip', { zlib: { level: 6 } });

    archive.on('error', (err) => {
      if (!res.headersSent) {
        res.status(500).json({ message: 'Erro ao gerar ZIP.', error: err.message });
      }
    });

    archive.pipe(res as any);

    for (const arq of arquivos) {
      archive.file(arq.caminho, { name: arq.nomeNoZip });
    }

    // Adiciona um manifesto JSON com metadados da entrega
    const manifesto = JSON.stringify(
      {
        entrega_id: entrega.id,
        funcionario: entrega?.funcionario?.nome ?? null,
        data: entrega.created_at,
        registrado_por: entrega.user_name ?? null,
        hash_pdf: entrega.hash_pdf ?? null,
        hash_foto: entrega.hash_foto ?? null,
        arquivos: arquivos.map((a) => a.nomeNoZip),
      },
      null,
      2,
    );

    archive.append(manifesto, { name: 'manifesto.json' });

    await archive.finalize();
  }
}
