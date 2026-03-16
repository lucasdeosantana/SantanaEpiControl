// src/audit/audit.controller.ts (atualizado)
import { Controller, Get, Param, Query, UseGuards, ParseIntPipe } from '@nestjs/common';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('audit-logs')
@UseGuards(JwtAuthGuard)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('evento') evento?: string,
    @Query('usuario') usuario?: string,
  ) {
    return this.auditService.findAll({
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      evento,
      usuario,
    });
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.auditService.findOne(id);
  }

  // Endpoint para verificar integridade de um dia
  @Get('integrity/:date')
  async verifyIntegrity(@Param('date') date: string) {
    return this.auditService.verifyDailyIntegrity(date);
  }

  // Endpoint para gerar hash manualmente (útil para testes)
  @Get('generate-daily-hash/:date')
  async generateDailyHash(@Param('date') date: string) {
    return this.auditService.generateDailyHash(date);
  }
}