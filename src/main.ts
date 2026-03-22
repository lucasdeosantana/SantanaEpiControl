import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { request } from 'http';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  const config = new DocumentBuilder()
  .setTitle('API EPI')
  .setDescription('Documentação da API do sistema de EPIs')
  .setVersion('1.0')
  .addBearerAuth() // para JWT
  .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document); // URL: /docs
  
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.setGlobalPrefix('api');
  app.enableCors();
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
  