import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as fs from 'fs';
import * as path from 'path';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // 配置CORS
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
  
  // 配置Swagger
  const config = new DocumentBuilder()
    .setTitle('叮咚待办 (DingDongTodo) API')
    .setDescription('DingDongTodo后端API文档')
    .setVersion('1.0')
    .addBearerAuth({
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      name: 'Authorization',
      description: 'JWT认证Bearer Token',
      in: 'header',
    })
    .build();
    
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);
  
  // 将文档保存到openapi.json文件
  const outputPath = path.join(process.cwd(), 'openapi.json');
  fs.writeFileSync(outputPath, JSON.stringify(document, null, 2));
  console.log(`OpenAPI文档已保存到: ${outputPath}`);
  
  await app.listen(process.env.PORT ?? 3000);
  console.log(`Application is running on: http://localhost:${process.env.PORT ?? 3000}`);
  console.log(`Swagger UI is available at: http://localhost:${process.env.PORT ?? 3000}/api-docs`);
}
bootstrap();
