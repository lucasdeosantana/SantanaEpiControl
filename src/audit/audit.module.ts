// src/audit/audit.module.ts (atualizado)
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLog } from './audit-log.entity';
import { DailyHashAudit } from './daily-hash.entity';
import { AuditService } from './audit.service';
import { AuditController } from './audit.controller';
import { DailyHashScheduler } from './daily-hash.scheduler';

@Module({
  imports: [TypeOrmModule.forFeature([AuditLog, DailyHashAudit])],
  providers: [AuditService, DailyHashScheduler],
  controllers: [AuditController],
  exports: [AuditService],
})
export class AuditModule {}