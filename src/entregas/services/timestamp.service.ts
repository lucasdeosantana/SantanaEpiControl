import { Injectable, Logger } from '@nestjs/common';
import * as OpenTimestamps from 'javascript-opentimestamps';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class TimestampService {
  private readonly logger = new Logger(TimestampService.name);

  /**
   * Envia o hash do PDF para o OpenTimestamps e salva o arquivo .ots
   * @param hashPdf - Hash SHA-256 do PDF em hex
   * @param entregaId - ID da entrega (para nomear o arquivo)
   * @returns Caminho do arquivo .ots gerado
   */
  async carimbar(hashPdf: string, entregaId: number): Promise<string> {
    this.logger.log(`Carimbando hash da entrega ${entregaId} no OpenTimestamps...`);

    const pasta = path.join(process.cwd(), 'uploads', 'timestamps');
    if (!fs.existsSync(pasta)) {
      fs.mkdirSync(pasta, { recursive: true });
    }

    const nomeArquivo = `entrega-${entregaId}-${Date.now()}.ots`;
    const caminho = path.join(pasta, nomeArquivo);

    // Converte o hash hex para bytes
    const hashBytes = Buffer.from(hashPdf, 'hex');
    const op = new OpenTimestamps.Ops.OpSHA256();
    const detached = OpenTimestamps.DetachedTimestampFile.fromHash(op, hashBytes);

    // Envia para os calendários públicos do OpenTimestamps
    await OpenTimestamps.stamp(detached);

    // Serializa e salva o arquivo .ots
    const serializado = detached.serializeToBytes();
    fs.writeFileSync(caminho, Buffer.from(serializado));

    this.logger.log(`Arquivo .ots salvo em: ${caminho}`);
    return caminho;
  }

  /**
   * Verifica se o timestamp já foi confirmado na blockchain Bitcoin
   * @param caminhoOts - Caminho do arquivo .ots
   * @returns true se já validado, false se ainda pendente
   */
  async verificar(caminhoOts: string): Promise<boolean> {
    try {
      this.logger.log(`Verificando timestamp: ${caminhoOts}`);

      const otsBytes = fs.readFileSync(caminhoOts);
      const detached = OpenTimestamps.DetachedTimestampFile.deserialize(otsBytes);

      await OpenTimestamps.verify(detached);

      // Se não lançou exceção e tem attestations confirmadas, está validado
      const attestations = detached.timestamp.getAttestations();
      const confirmado = [...attestations].some(
        (a) => a instanceof OpenTimestamps.Notary.BitcoinBlockHeaderAttestation,
      );

      this.logger.log(`Timestamp confirmado: ${confirmado}`);
      return confirmado;
    } catch (error) {
      this.logger.warn(`Timestamp ainda não confirmado: ${error.message}`);
      return false;
    }
  }
}
