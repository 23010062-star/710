import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Cho phép frontend (Vite) gọi API cross-origin
  app.enableCors();

  // Validation toàn cục: tự động validate DTO và transform query/body
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`🚀 Library API đang chạy tại: http://localhost:${port}`);
}
void bootstrap();
