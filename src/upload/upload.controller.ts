import { 
  Controller, Post, UseInterceptors, UploadedFile, 
  UseGuards, BadRequestException 
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

// Storage para imagens públicas (sem subpastas)
const storagePublico = diskStorage({
  destination: './public/images',
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `imagem-${uniqueSuffix}${extname(file.originalname)}`);
  },
});

// Storage para assinaturas (separado por ano/mês)
// const storageAssinatura = diskStorage({
//   destination: (req, file, cb) => {
//     const now = new Date();
//     const ano = now.getFullYear();
//     const mes = String(now.getMonth() + 1).padStart(2, '0'); // "03", "11", etc.

//     const pasta = `./uploads/assinaturas/${ano}/${mes}`;

//     // Cria a pasta se não existir
//     if (!existsSync(pasta)) {
//       mkdirSync(pasta, { recursive: true });
//     }

//     cb(null, pasta);
//   },
//   filename: (req, file, cb) => {
//     const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
//     cb(null, `assinatura-${uniqueSuffix}${extname(file.originalname)}`);
//   },
// });

@Controller('upload')
@UseGuards(JwtAuthGuard)
export class UploadController {

  @Post('publico')
  @UseInterceptors(FileInterceptor('imagem', { storage: storagePublico }))
  uploadPublico(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('Arquivo não enviado');

    return {
      url: `/images/${file.filename}`,
      storage: 'public',
    };
  }

  // @Post('assinatura')
  // @UseInterceptors(FileInterceptor('assinatura', { storage: storageAssinatura }))
  // uploadAssinatura(@UploadedFile() file: Express.Multer.File) {
  //   if (!file) throw new BadRequestException('Arquivo não enviado');

  //   const now = new Date();
  //   const ano = now.getFullYear();
  //   const mes = String(now.getMonth() + 1).padStart(2, '0');

  //   return {
  //     path: `/uploads/assinaturas/${ano}/${mes}/${file.filename}`,
  //     storage: 'private/signature',
  //   };
  // }
}