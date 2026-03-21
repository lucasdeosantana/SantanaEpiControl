import {
  Controller, Post, Get, Param, UseGuards,
  UseInterceptors, UploadedFile, Body, Request,
  BadRequestException, ParseIntPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { EntregasService } from './entregas.service';
import { CreateEntregaDto } from './dto/create-entrega.dto';

@Controller('entregas')
@UseGuards(JwtAuthGuard)
export class EntregasController {
  constructor(private readonly entregasService: EntregasService) {}

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
      req.user.username,
      foto.buffer,
      foto.originalname,
    );
  }

  @Get()
  findAll() {
    return this.entregasService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.entregasService.findOne(id);
  }

  @Get('funcionario/:funcionarioId')
  findByFuncionario(@Param('funcionarioId', ParseIntPipe) funcionarioId: number) {
    return this.entregasService.findByFuncionario(funcionarioId);
  }
}
