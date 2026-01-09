import { NestFactory, HttpAdapterHost } from '@nestjs/core';
import { AppModule } from './app.module';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));
  const httpAdapter = app.get(HttpAdapterHost);
  app.useGlobalFilters(new AllExceptionsFilter(httpAdapter));
  app.enableCors();

  await app.listen(3001);
  console.log(`Application is running on: ${await app.getUrl()}`);
}

bootstrap();
