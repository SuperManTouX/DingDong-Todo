import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client } from '@aws-sdk/client-s3';

@Injectable()
export class S3Config {
  private s3Client: S3Client;
  private bucketName: string;
  private baseUrl: string;

  constructor(private configService: ConfigService) {
    const accessKeyId = this.configService.get('AWS_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get('AWS_SECRET_ACCESS_KEY');
    const region = this.configService.get('AWS_REGION', 'us-east-1');
    const endpoint = this.configService.get('S3_ENDPOINT');

    // 初始化S3客户端
    this.s3Client = new S3Client({
      region,
      credentials: accessKeyId && secretAccessKey
        ? {
            accessKeyId,
            secretAccessKey,
          }
        : undefined,
      endpoint: endpoint || undefined,
      forcePathStyle: !!endpoint, // 如果有自定义endpoint，通常需要启用path style
    });

    // 设置存储桶名称和基础URL
    this.bucketName = this.configService.get('S3_BUCKET_NAME', 'dingdongtodo-avatars');
    this.baseUrl = this.configService.get('S3_BASE_URL', `https://${this.bucketName}.s3.${region}.amazonaws.com`);
  }

  // 获取S3客户端实例
  getS3Client(): S3Client {
    return this.s3Client;
  }

  // 获取存储桶名称
  getBucketName(): string {
    return this.bucketName;
  }

  // 获取基础URL
  getBaseUrl(): string {
    return this.baseUrl;
  }
}