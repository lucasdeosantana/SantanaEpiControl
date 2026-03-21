import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as faceapi from 'face-api.js';
import { Canvas, Image, ImageData, createCanvas, loadImage } from 'canvas';
import * as path from 'path';

// Patch face-api.js para usar canvas do Node.js
faceapi.env.monkeyPatch({ Canvas, Image, ImageData } as any);

@Injectable()
export class FaceDetectionService implements OnModuleInit {
  private readonly logger = new Logger(FaceDetectionService.name);
  private modelosCarregados = false;

  // Caminho onde os modelos do face-api.js ficam salvos
  private readonly MODELS_PATH = path.join(process.cwd(), 'face-models');

  async onModuleInit() {
    await this.carregarModelos();
  }

  private async carregarModelos(): Promise<void> {
    try {
      this.logger.log('Carregando modelos de detecção de face...');
      await faceapi.nets.ssdMobilenetv1.loadFromDisk(this.MODELS_PATH);
      this.modelosCarregados = true;
      this.logger.log('Modelos carregados com sucesso!');
    } catch (error) {
      this.logger.error('Erro ao carregar modelos de face-api.js:', error.message);
      this.logger.warn('Face detection desabilitada. Baixe os modelos em: https://github.com/justadudewhohacks/face-api.js/tree/master/weights');
      this.modelosCarregados = false;
    }
  }

  /**
   * Detecta se há um rosto humano na imagem.
   * Retorna true se detectado, false caso contrário.
   * Se os modelos não estiverem carregados, retorna true (permissivo).
   */
  async detectarRostoHumano(caminhoImagem: string): Promise<boolean> {
    if (!this.modelosCarregados) {
      this.logger.warn('Modelos não carregados — pulando detecção de face.');
      return true; // Permissivo: não bloqueia se os modelos não estiverem disponíveis
    }

    try {
      const imagem = await loadImage(caminhoImagem);
      const canvas = createCanvas(imagem.width, imagem.height);
      const ctx = canvas.getContext('2d');
      ctx.drawImage(imagem as any, 0, 0);

      const deteccoes = await faceapi.detectAllFaces(
        canvas as any,
        new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }),
      );

      this.logger.log(`Faces detectadas: ${deteccoes.length}`);
      return deteccoes.length > 0;
    } catch (error) {
      this.logger.error('Erro na detecção de face:', error.message);
      return false;
    }
  }
}
