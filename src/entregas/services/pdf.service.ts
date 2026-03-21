import { Injectable, Logger } from '@nestjs/common';
import { Entrega } from '../entrega.entity';
import * as path from 'path';
import * as fs from 'fs';
import PDFDocument = require('pdfkit');

@Injectable()
export class PdfService {
  private readonly logger = new Logger(PdfService.name);

  /**
   * Gera o PDF da entrega de EPI.
   * TODO: Implementar a geração do PDF com o modelo desejado.
   * Sugestões: pdfkit, puppeteer, @nestjs/pdf
   *
   * @param entrega - Entidade completa da entrega (com funcionário e EPIs)
   * @returns Caminho absoluto do PDF gerado
   */
  async gerarPdf(entrega: Entrega): Promise<string> {
    // this.logger.log(`Gerando PDF para entrega ID ${entrega.id}...`);

    // const pasta = path.join(process.cwd(), 'uploads', 'pdfs');
    // if (!fs.existsSync(pasta)) {
    //   fs.mkdirSync(pasta, { recursive: true });
    // }

    // const nomeArquivo = `entrega-${entrega.id}-${Date.now()}.pdf`;
    // const caminho = path.join(pasta, nomeArquivo);

    // // ─────────────────────────────────────────────────────────────────────────
    // // TODO: Implemente aqui a geração do PDF
    // // Dados disponíveis:
    // //   entrega.funcionario  → todos os dados do funcionário
    // //   entrega.epis         → lista de EPIs entregues
    // //   entrega.foto         → caminho da foto de validação
    // //   entrega.created_at   → data da entrega
    // //   entrega.user_name    → usuário que registrou
    // // ─────────────────────────────────────────────────────────────────────────

    // throw new Error('gerarPdf() ainda não implementado. Veja o TODO em pdf.service.ts');

    // return caminho;
    this.logger.log(`Gerando PDF (leve) para entrega ID ${entrega.id}...`);

    const pasta = path.join(process.cwd(), 'uploads', 'pdfs');
    fs.mkdirSync(pasta, { recursive: true });

    const nomeArquivo = `entrega-${entrega.id}-${Date.now()}.pdf`;
    const caminho = path.join(pasta, nomeArquivo);

    // Cria o PDF (sem imagens) => muito leve
    const doc = new PDFDocument({
      size: 'A4',
      margin: 50,
      compress: true, // comprime streams do PDF
      info: {
        Title: `Entrega de EPI #${entrega.id}`,
        Author: 'Sistema EPI',
      },
    });

    const stream = fs.createWriteStream(caminho);
    doc.pipe(stream);

    // Cabeçalho
    doc.fontSize(18).text('Comprovante de Entrega de EPI', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(10).fillColor('#555').text(`Entrega ID: ${entrega.id}`, { align: 'center' });
    doc.moveDown(1);
    doc.fillColor('#000');

    // Dados gerais
    const dataEntrega = entrega.created_at
      ? new Date(entrega.created_at).toLocaleString('pt-BR')
      : '(sem data)';

    doc.fontSize(12).text(`Data/Hora: ${dataEntrega}`);
    doc.text(`Registrado por: ${entrega.user_name || '(não informado)'}`);
    doc.moveDown(0.8);

    // Funcionário
    doc.fontSize(13).text('Funcionário', { underline: true });
    doc.moveDown(0.3);

    // Ajuste conforme seus campos reais do Funcionario
    doc.fontSize(12).text(`Nome: ${entrega.funcionario?.nome ?? '(não informado)'}`);
    if (entrega.funcionario?.cpf) doc.text(`CPF: ${entrega.funcionario.cpf}`);
    if (entrega.funcionario?.matricula) doc.text(`Matrícula: ${entrega.funcionario.matricula}`);
    if (entrega.funcionario?.setor) doc.text(`Setor: ${entrega.funcionario.setor}`);
    doc.moveDown(0.8);

    // EPIs
    doc.fontSize(13).text('EPIs Entregues', { underline: true });
    doc.moveDown(0.3);

    if (!entrega.epis?.length) {
      doc.fontSize(12).text('- (nenhum EPI na entrega)');
    } else {
      entrega.epis.forEach((epi, idx) => {
        // Ajuste conforme seus campos do Epi: descricao, ca, fabricante, tipo
        const linha =
          `${idx + 1}. ${epi.descricao}` +
          (epi.ca ? ` | CA: ${epi.ca}` : '') +
          (epi.fabricante ? ` | Fab: ${epi.fabricante}` : '') +
          (epi.tipo ? ` | Tipo: ${epi.tipo}` : '');

        doc.fontSize(11).text(linha);
      });
    }

    doc.moveDown(1);

    // Validação (sem embutir foto pra manter o PDF leve)
    doc.fontSize(13).text('Validação', { underline: true });
    doc.moveDown(0.3);
    doc.fontSize(11).text(`Foto (arquivo): ${entrega.foto || '(não anexada)'}`);
    doc.text(`Hash da foto: ${entrega.hash_foto || '(não calculado)'}`);

    // Rodapé
    doc.moveDown(1.2);
    doc.fontSize(9).fillColor('#666').text(
      'Observação: este PDF é gerado de forma leve (sem imagem embutida). A foto fica armazenada como arquivo separadamente.',
      { align: 'left' },
    );

    doc.end();

    // Espera terminar de escrever no disco
    await new Promise<void>((resolve, reject) => {
      stream.on('finish', () => resolve());
      stream.on('error', (err) => reject(err));
    });

    return caminho;
  }
}
