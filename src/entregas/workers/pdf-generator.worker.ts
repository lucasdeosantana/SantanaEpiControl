import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EntregasService } from '../entregas.service';
import { PdfService } from '../services/pdf.service';
import { TimestampService } from '../services/timestamp.service';

@Injectable()
export class PdfGeneratorWorker {
  private readonly logger = new Logger(PdfGeneratorWorker.name);
  private processando = false; // Trava para garantir FIFO (um por vez)

  constructor(
    private readonly entregasService: EntregasService,
    private readonly pdfService: PdfService,
    private readonly timestampService: TimestampService,
  ) {}

  // Roda a cada 30 segundos verificando a fila
  @Cron('*/30 * * * * *')
  async processarFila(): Promise<void> {
    if (this.processando) {
      this.logger.debug('Worker já em execução, pulando ciclo.');
      return;
    }

    const pendentes = await this.entregasService.findPendentesProcessamento();
    if (pendentes.length === 0) return;

    this.processando = true;
    this.logger.log(`Processando ${pendentes.length} entrega(s) na fila...`);

    // FIFO: processa uma por vez na ordem de criação
    for (const entrega of pendentes) {
      try {
        this.logger.log(`Gerando PDF para entrega ID ${entrega.id}...`);

        // 1. Gera o PDF (função a ser implementada)
        const caminhoPdf = await this.pdfService.gerarPdf(entrega);

        // 2. Calcula hash do PDF
        const hashPdf = this.entregasService.calcularHashArquivo(caminhoPdf);

        // 3. Envia para OpenTimestamps e salva o .ots
        const caminhoOts = await this.timestampService.carimbar(hashPdf, entrega.id);

        // 4. Atualiza status para "created"
        await this.entregasService.atualizarStatus(
          entrega.id,
          'created',
          { arquivo_pdf: caminhoPdf, hash_pdf: hashPdf, arquivo_timestamp: caminhoOts },
          'worker.pdf',
        );

        this.logger.log(`Entrega ${entrega.id} processada com sucesso.`);
      } catch (error) {
        this.logger.error(`Erro ao processar entrega ${entrega.id}: ${error.message}`);

        // Marca como erro e registra a mensagem
        await this.entregasService.atualizarStatus(
          entrega.id,
          'error',
          {},
          'worker.pdf',
          error.message,
        );
      }
    }

    this.processando = false;
  }
}
