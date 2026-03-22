import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { request } from 'http';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');
  app.enableCors();

    await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
  