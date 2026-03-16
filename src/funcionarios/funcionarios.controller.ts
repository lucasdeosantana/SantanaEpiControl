// src/funcionarios/funcionarios.controller.ts
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
  ParseIntPipe,
} from '@nestjs/common';
import { FuncionariosService } from './funcionarios.service';
import { CreateFuncionarioDto } from './dto/create-funcionario.dto';
import { UpdateFuncionarioDto } from './dto/update-funcionario.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from './guards/admin.guard';

@Controller('funcionarios')
@UseGuards(JwtAuthGuard)
export class FuncionariosController {
  constructor(private readonly funcionariosService: FuncionariosService) {}

  @UseGuards(AdminGuard)
  @Post()
  create(@Body() createFuncionarioDto: CreateFuncionarioDto, @Req() req) {
    return this.funcionariosService.create(createFuncionarioDto, req.user.username || String(req.user.userId));
  }

  @Get()
  findAll() {
    return this.funcionariosService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.funcionariosService.findOne(id);
  }

  @UseGuards(AdminGuard)
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateFuncionarioDto: UpdateFuncionarioDto,
    @Req() req,
  ) {
    return this.funcionariosService.update(id, updateFuncionarioDto, req.user.isAdmin, req.user.username || String(req.user.userId));
  }

  @UseGuards(AdminGuard)
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @Req() req) {
    return this.funcionariosService.remove(id, req.user.isAdmin, req.user.username || String(req.user.userId));
  }

  @UseGuards(AdminGuard)
  @Post(':id/reactivate')
  reactivate(@Param('id', ParseIntPipe) id: number, @Req() req) {
    return this.funcionariosService.reactivate(id, req.user.isAdmin, req.user.username || String(req.user.userId));
  }
}