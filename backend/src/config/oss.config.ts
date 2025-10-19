import { Injectable } from '@nestjs/common';
// 使用正确的导入方式
let OSS;
try {
  OSS = require('ali-oss');
} catch (error) {
  console.warn('ali-oss包未正确安装或无法加载');
  // 创建一个空对象作为备用
  OSS = {}
}

@Injectable()
export class OssConfig {
  private readonly region: string;
  private readonly bucketName: string;

  private readonly endpoint: string;

  constructor() {
    // 尝试从环境变量获取配置，提供默认值作为后备
    this.region = process.env.OSS_REGION || 'oss-cn-beijing';
    this.bucketName = process.env.OSS_BUCKET || process.env.OSS_BUCKET_NAME || 'todo-avatar';
    this.endpoint = process.env.OSS_ENDPOINT || `https://${this.region}.aliyuncs.com`;
    
    console.log(`OSS配置初始化 - 区域: ${this.region}, Bucket名称: ${this.bucketName}, Endpoint: ${this.endpoint}`);
    
    // 检查必需的环境变量是否存在（仅记录警告，不阻止初始化）
    this.checkEnvironmentVariables();
  }

  /**
   * 检查环境变量并记录警告
   */
  private checkEnvironmentVariables(): void {
    const requiredEnvVars = [
      { key: 'OSS_ACCESS_KEY_ID', name: '阿里云访问密钥ID' },
      { key: 'OSS_ACCESS_KEY_SECRET', name: '阿里云访问密钥密钥' },
      { key: 'OSS_STS_ROLE_ARN', name: '阿里云STS角色ARN' },
    ];
    
    requiredEnvVars.forEach(({ key, name }) => {
      if (!process.env[key]) {
        console.warn(`警告: 环境变量 ${key} (${name}) 未设置，OSS功能可能无法正常工作`);
      } else {
        console.log(`环境变量 ${key} 已成功加载`);
      }
    });
  }

  /**
   * 获取阿里云OSS临时访问凭证
   * @param userId 用户ID
   * @param roleSessionName 角色会话名称
   * @param expiration 过期时间（秒）
   * @returns 临时访问凭证
   */
  async getStsCredentials(
    userId: string,
    roleSessionName: string = 'user-avatar-upload',
    expiration: number = 3600
  ): Promise<{  
    AccessKeyId: string;
    AccessKeySecret: string;
    SecurityToken: string;
    Expiration: string;
  }> {
    
    console.log(`获取OSS临时凭证 - 用户ID: ${userId}`);
    
    try {
      // 验证必要的环境变量
      if (!process.env.OSS_ACCESS_KEY_ID) {
        console.error('无法获取OSS凭证: OSS_ACCESS_KEY_ID 环境变量未设置');
        throw new Error('OSS_ACCESS_KEY_ID environment variable is required');
      }
      if (!process.env.OSS_ACCESS_KEY_SECRET) {
        console.error('无法获取OSS凭证: OSS_ACCESS_KEY_SECRET 环境变量未设置');
        throw new Error('OSS_ACCESS_KEY_SECRET environment variable is required');
      }
      if (!process.env.OSS_STS_ROLE_ARN) {
        console.error('无法获取OSS凭证: OSS_STS_ROLE_ARN 环境变量未设置');
        throw new Error('OSS_STS_ROLE_ARN environment variable is required');
      }
      
      // 记录环境变量状态（但不记录敏感信息）
      console.log(`环境变量 OSS_ACCESS_KEY_ID: ${process.env.OSS_ACCESS_KEY_ID ? '已设置' : '未设置'}`);
      console.log(`环境变量 OSS_ACCESS_KEY_SECRET: ${process.env.OSS_ACCESS_KEY_SECRET ? '已设置' : '未设置'}`);
      console.log(`环境变量 OSS_STS_ROLE_ARN: ${process.env.OSS_STS_ROLE_ARN ? '已设置' : '未设置'}`);
      
      // 改用ali-oss包中的STS客户端
      console.log('使用ali-oss包中的STS客户端');
      const { STS } = require('ali-oss');
      
      // 初始化STS客户端
      const sts = new STS({
        accessKeyId: process.env.OSS_ACCESS_KEY_ID,
        accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET
      });
      
      console.log(`准备调用assumeRole - roleArn: ${process.env.OSS_STS_ROLE_ARN}, sessionName: ${roleSessionName}-${userId}`);
      
      // 调用assumeRole接口获取STS临时访问凭证
      // 参数: roleArn, policy(空字符串), expirationSeconds, roleSessionName
      const result = await sts.assumeRole(
        process.env.OSS_STS_ROLE_ARN, 
        '', 
        expiration, 
        `${roleSessionName}-${userId}`
      );
      
      console.log('STS assumeRole响应结构:', Object.keys(result || {}));
      
      // 检查result.credentials是否存在且是对象类型
      if (!result || typeof result !== 'object' || !result.credentials || typeof result.credentials !== 'object') {
        console.error('STS响应中缺少credentials字段或credentials不是对象:', JSON.stringify(result));
        throw new Error('Invalid STS response: missing or invalid credentials');
      }
      
      console.log('credentials字段存在且是对象，结构:', Object.keys(result.credentials));
      console.log('credentials完整内容:', JSON.stringify(result.credentials));
      
      // 提取临时访问凭证（添加空值检查）
      const accessKeyId = result.credentials.AccessKeyId || result.credentials.accessKeyId;
      const accessKeySecret = result.credentials.AccessKeySecret || result.credentials.accessKeySecret;
      const securityToken = result.credentials.SecurityToken || result.credentials.securityToken;
      const expTime = result.credentials.Expiration || result.credentials.expiration;
      
      // 验证必要的凭证字段
      if (!accessKeyId || !accessKeySecret || !securityToken) {
        console.error('凭证信息不完整:', {
          accessKeyId: !!accessKeyId, 
          accessKeySecret: !!accessKeySecret, 
          securityToken: !!securityToken,
          originalCredentials: JSON.stringify(result.credentials)
        });
        throw new Error('Invalid STS response: incomplete credentials');
      }
      
      // 返回格式化的凭证
      const formattedCredentials = {
        AccessKeyId: accessKeyId,
        AccessKeySecret: accessKeySecret,
        SecurityToken: securityToken,
        Expiration: expTime || new Date(Date.now() + expiration * 1000).toISOString()
      };
      
      console.log('成功获取OSS临时访问凭证');
      return formattedCredentials;
    } catch (error) {
      console.error('获取OSS临时访问凭证失败:', error.message || error);
      
      // 检查是否是包版本或兼容性问题
      if (error.message && (error.message.includes('is not a function') || error.message.includes('Cannot read properties'))) {
        console.error('可能是ali-oss包版本问题，请检查包的安装和版本');
      }
      
      throw new Error('Failed to get OSS credentials');
    }
  }

  /**
   * 创建OSS客户端（使用临时凭证）
   * @param credentials 临时访问凭证
   * @returns OSS客户端实例或null（如果创建失败）
   */
  createOssClient(credentials: {
    AccessKeyId: string;
    AccessKeySecret: string;
    SecurityToken: string;
  }) {
    try {
      // 检查OSS是否可用
      if (typeof OSS !== 'function' && typeof OSS.OSS !== 'function') {
        console.error('OSS库未正确加载，无法创建客户端');
        return null;
      }
      
      // 根据OSS库的导出方式创建客户端
      const OSSConstructor = typeof OSS === 'function' ? OSS : OSS.OSS;
      
      // 创建OSS客户端配置，包含所有可能的属性
      const clientConfig = {
        accessKeyId: credentials.AccessKeyId,
        accessKeySecret: credentials.AccessKeySecret,
        stsToken: credentials.SecurityToken,
        bucket: this.bucketName,
        // 同时设置endpoint和region，但在使用时会优先使用endpoint
        endpoint: this.endpoint,
        region: this.region
      };
      
      console.log('创建OSS客户端配置:', {
        endpoint: this.endpoint ? '已设置' : '未设置',
        region: this.region,
        bucket: this.bucketName
      });
      
      return new OSSConstructor(clientConfig);
    } catch (error) {
      console.error('创建OSS客户端失败:', error.message || error);
      return null;
    }
  }

  /**
   * 生成对象的URL
   * @param objectKey 对象键
   * @returns 可访问的URL
   */
  getObjectUrl(objectKey: string): string {
    // 确保objectKey不以/开头
    const cleanObjectKey = objectKey.startsWith('/') ? objectKey.substring(1) : objectKey;
    
    // 生成标准的阿里云OSS访问URL格式
    // 根据用户提供的可访问URL示例：https://todo-avatar.oss-cn-beijing.aliyuncs.com/avatars/user-001/1758975264618.jpg
    return `https://${this.bucketName}.${this.region}.aliyuncs.com/${cleanObjectKey}`;
  }

  /**
   * 获取bucket名称
   */
  getBucketName(): string {
    return this.bucketName;
  }
  
  /**
   * 获取OSS区域
   */
  getRegion(): string {
    return this.region;
  }
  
  /**
   * 获取OSS端点
   */
  getEndpoint(): string {
    return this.endpoint;
  }
}