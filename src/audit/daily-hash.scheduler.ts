// src/audit/daily-hash.scheduler.ts
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AuditService } from './audit.service';

@Injectable()
export class DailyHashScheduler {
  private readonly logger = new Logger(DailyHashScheduler.name);

  constructor(private readonly auditService: AuditService) {}

  /**
   * Roda todo dia à meia-noite (00:00)
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleDailyHashGeneration() {
    this.logger.log('Iniciando geração de hash diário...');
    
    try {
      const result = await this.auditService.generateDailyHash();
      this.logger.log(`Hash diário gerado com sucesso para ${result.data_referencia}: ${result.hash_consolidado}`);
    } catch (error) {
      this.logger.error('Erro ao gerar hash diário:', error.message);
    }
  }
}