import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Entrega } from './entrega.entity';
import { Funcionario } from '../funcionarios/funcionario.entity';
import { Epi } from '../epis/epi.entity';

import { EntregasService } from './entregas.service';
import { EntregasController } from './entregas.controller';

import { PdfService } from './services/pdf.service';
import { TimestampService } from './services/timestamp.service';
import { FaceDetectionService } from './services/face-detection.service';

import { PdfGeneratorWorker } from './workers/pdf-generator.worker';
import { TimestampValidatorWorker } from './workers/timestamp-validator.worker';

import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Entrega, Funcionario, Epi]),
    AuditModule,
  ],
  controllers: [EntregasController],
  providers: [
    EntregasService,
    PdfService,
    TimestampService,
    FaceDetectionService,
    PdfGeneratorWorker,
    TimestampValidatorWorker,
  ],
})
export class EntregasModule {}
