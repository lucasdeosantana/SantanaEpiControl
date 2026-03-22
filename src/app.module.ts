// src/app.module.ts (atualizado)
import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { User } from './auth/user.entity';
import { FuncionariosModule } from './funcionarios/funcionarios.module';
import { Funcionario } from './funcionarios/funcionario.entity';
import { EpisModule } from './epis/epis.module';
import { Epi } from './epis/epi.entity';
import { AuditModule } from './audit/audit.module';
import { AuditLog } from './audit/audit-log.entity';
import { DailyHashAudit } from './audit/daily-hash.entity';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { UploadModule } from './upload/upload.module';
import { EntregasModule } from './entregas/entregas.module';
import { Entrega } from './entregas/entrega.entity'
import { EntregaEpiItem } from './entregas/entrega-epi-item.entity'

@Module({
  imports: [
    ScheduleModule.forRoot(), // Adicione isso para habilitar tarefas agendadas
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'database.sqlite',
      entities: [User, Funcionario, Epi, AuditLog, DailyHashAudit, Entrega, EntregaEpiItem],
      synchronize: true,
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'), // Pasta public na raiz do projeto
    }),
    AuthModule,
    FuncionariosModule,
    EpisModule,
    AuditModule,
    UploadModule,
    EntregasModule
  ],
})
export class AppModule {}