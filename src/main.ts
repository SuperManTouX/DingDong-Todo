import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: (origin, callback) => {
      // 检查是否是localhost的请求
      if (!origin) return callback(null, true);
      
      const match = origin.match(/^http:\/\/localhost:(\d+)$/);
      if (match) {
        return callback(null, true);
      }
      
      callback(new Error('Not allowed by CORS'));
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true, // 允许携带cookie
  });
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
