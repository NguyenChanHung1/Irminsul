import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { loadRootEnv } from './load-root-env';

async function bootstrap() {
  loadRootEnv();
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  await app.listen(3001);
  console.log('Backend running on http://localhost:3001');
}

bootstrap();
