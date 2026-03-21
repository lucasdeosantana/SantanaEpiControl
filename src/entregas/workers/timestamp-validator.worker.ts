import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { EntregasService } from '../entregas.service';
import { TimestampService } from '../services/timestamp.service';

@Injectable()
export class TimestampValidatorWorker {
  private readonly logger = new Logger(TimestampValidatorWorker.name);

  constructor(
    private readonly entregasService: EntregasService,
    private readonly timestampService: TimestampService,
  ) {}

  // Roda 2x ao dia: meia-noite e meio-dia
  @Cron('0 0 0,12 * * *')
  async validarTimestamps(): Promise<void> {
    this.logger.log('Iniciando validação de timestamps...');

    const pendentes = await this.entregasService.findPendentesValidacao();
    if (pendentes.length === 0) {
      this.logger.log('Nenhuma entrega aguardando validação.');
      return;
    }

    this.logger.log(`Verificando ${pendentes.length} entrega(s)...`);

    for (const entrega of pendentes) {
      try {
        if (!entrega.arquivo_timestamp) {
          this.logger.warn(`Entrega ${entrega.id} sem arquivo .ots, pulando.`);
          continue;
        }

        const validado = await this.timestampService.verificar(entrega.arquivo_timestamp);

        if (validado) {
          await this.entregasService.atualizarStatus(
            entrega.id,
            'validated',
            {},
            'worker.timestamp',
          );
          this.logger.log(`Entrega ${entrega.id} validada na blockchain!`);
        } else {
          this.logger.log(`Entrega ${entrega.id} ainda aguardando confirmação Bitcoin.`);
        }
      } catch (error) {
        this.logger.error(`Erro ao validar entrega ${entrega.id}: ${error.message}`);

        await this.entregasService.atualizarStatus(
          entrega.id,
          'error',
          {},
          'worker.timestamp',
          error.message,
        );
      }
    }
  }
}
