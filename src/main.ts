import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { request } from 'http';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');
  app.enableCors();
// app.use((req, res, next) => {
//   console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
//   console.log('Headers:', req.headers);
//   console.log('Body:', req.body);
//   next();
// });
    await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
  