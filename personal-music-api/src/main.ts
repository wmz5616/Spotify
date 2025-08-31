import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 启用CORS，允许跨域请求
  app.enableCors();

  await app.listen(3000);
}
bootstrap();
