// src/epis/epis.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
} from '@nestjs/common';
import { EpisService } from './epis.service';
import { CreateEpiDto } from './dto/create-epi.dto';
import { UpdateEpiDto } from './dto/update-epi.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../funcionarios/guards/admin.guard';

@Controller('epis')
export class EpisController {
  constructor(private readonly episService: EpisService) {}

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Post()
  create(@Body() createEpiDto: CreateEpiDto, @Req() req) {
    return this.episService.create(createEpiDto, req.user.username);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll() {
    return this.episService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.episService.findOne(+id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('codigo/:codigo')
  findByCodigo(@Param('codigo') codigo: string) {
    return this.episService.findByCodigo(codigo);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateEpiDto: UpdateEpiDto, @Req() req) {
    return this.episService.update(+id, updateEpiDto, req.user.username);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Delete(':id')
  remove(@Param('id') id: string, @Req() req) {
    return this.episService.remove(+id, req.user.username);
  }
}