import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as fs from 'fs';
import * as path from 'path';

function parseCorsOrigins(envValue?: string): string[] {
  if (!envValue) return [];
  return envValue
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

function isAllowedDevOrigin(origin: string): boolean {
  const localhostPattern = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i;
  const lanIpPattern = /^https?:\/\/(192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3})(:\d+)?$/i;
  return localhostPattern.test(origin) || lanIpPattern.test(origin);
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configuredOrigins = parseCorsOrigins(process.env.CORS_ORIGINS);

  // 配置 CORS：优先使用环境变量白名单，开发环境放行常见本地/局域网来源
  app.enableCors({
    origin: (origin, callback) => {
      // 非浏览器请求（如 Postman/服务间调用）允许
      if (!origin) {
        return callback(null, true);
      }

      const isConfiguredAllowed = configuredOrigins.includes(origin);
      if (isConfiguredAllowed || isAllowedDevOrigin(origin)) {
        return callback(null, true);
      }

      return callback(new Error(`CORS blocked for origin: ${origin}`), false);
    },
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
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
