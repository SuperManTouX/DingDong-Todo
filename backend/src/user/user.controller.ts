import { Controller, Get, Put, Body, Req, UseGuards, Post } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UserService } from './user.service';
import { OssConfig } from '../config/oss.config';
import { v4 as uuidv4 } from 'uuid';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('用户管理')
@Controller('users')
export class UserController {
  constructor(
    private userService: UserService,
    private ossConfig: OssConfig
  ) {}

  /**
   * 获取用户个人信息
   */
  @ApiOperation({
    summary: '获取用户个人信息',
    description: '获取当前登录用户的详细个人信息',
  })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  @UseGuards(AuthGuard('jwt'))
  @Get('profile')
  getProfile(@Req() req) {
    return this.userService.findById(req.user.id);
  }

  /**
   * 更新用户个人信息
   */
  @ApiOperation({
    summary: '更新用户个人信息',
    description: '更新当前登录用户的个人信息',
  })
  @ApiBearerAuth()
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        username: { type: 'string', description: '用户名' },
        bio: { type: 'string', description: '个人简介' },
      },
    },
  })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  @UseGuards(AuthGuard('jwt'))
  @Put('profile')
  updateProfile(@Req() req, @Body() body) {
    return this.userService.updateUser(req.user.id, body);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('avatar/presigned-url')
  async getOssCredentialsForAvatar(@Req() req, @Body() body: { fileName: string; fileType?: string }) {
    try {
      const { fileName, fileType } = body;
      const userId = req.user.id;      
      console.log('收到的文件类型:', fileType);
      console.log('收到的文件名:', fileName);
      console.log('用户ID:', userId);
      
      // 生成文件名，确保文件路径包含用户ID
      const timestamp = Date.now();
      const extension = fileName.split('.').pop() || 'jpg';
      const objectKey = `avatars/${userId}/${timestamp}.${extension}`;    
      
      // 生产环境：获取真实的临时访问凭证
      const stsCredentials = await this.ossConfig.getStsCredentials(userId);
      console.log('从OSS配置获取的临时凭证结构:', Object.keys(stsCredentials || {}));
      
      // 生成可访问的文件URL
      const fileUrl = this.ossConfig.getObjectUrl(objectKey);
      
      // 构建返回对象
      const response = {
        credentials: stsCredentials, // 确保credentials字段存在
        fileUrl,
        objectKey,
        bucketName: this.ossConfig.getBucketName(),
        region: this.ossConfig.getRegion(),
        fileName: `${timestamp}.${extension}`,
        expiresIn: 3600,
        mode: 'production'
      };
      
      console.log('返回给客户端的数据结构:', Object.keys(response));
      
      return response;
    } catch (error) {
      console.error('获取阿里云OSS临时访问凭证失败:', error);
      throw new Error('Failed to get OSS credentials');
    }
  }

  @UseGuards(AuthGuard('jwt'))
  @Put('avatar')
  async updateAvatar(@Req() req, @Body() body: { avatarUrl: string }) {
    const { avatarUrl } = body;
    
    try {
      // 更新用户头像URL到数据库
      const updatedUser = await this.userService.updateAvatar(req.user.id, avatarUrl);
      
      return {
        success: true,
        message: '头像更新成功',
        avatarUrl: updatedUser.avatar
      };
    } catch (error) {
      console.error('更新头像失败:', error);
      throw new Error('头像更新失败，请重试');
    }
  }

  // 测试端点 - 用于诊断OSS STS凭证问题
  @UseGuards(AuthGuard('jwt'))
  @Get('test-sts-credentials')
  async testStsCredentials(@Req() req) {
    try {
      const userId = req.user.id;
      console.log('测试获取OSS临时凭证 - 用户ID:', userId);
      
      // 直接调用getStsCredentials方法
      const credentials = await this.ossConfig.getStsCredentials(userId);
      
      console.log('测试获取到的凭证结构:', Object.keys(credentials || {}));
      
      return {
        success: true,
        credentials: {
          AccessKeyId: credentials.AccessKeyId ? '已获取(省略显示)' : '缺失',
          AccessKeySecret: credentials.AccessKeySecret ? '已获取(省略显示)' : '缺失',
          SecurityToken: credentials.SecurityToken ? '已获取(省略显示)' : '缺失',
          Expiration: credentials.Expiration || '无过期时间'
        },
        message: '成功获取OSS临时访问凭证',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('测试获取OSS临时访问凭证失败:', error);
      return {
        success: false,
        error: error.message || error.toString(),
        message: '获取OSS临时访问凭证失败',
        timestamp: new Date().toISOString()
      };
    }
  }
  
  @UseGuards(AuthGuard('jwt'))
  @Get('debug-oss-config')
  async debugOssConfig(@Req() req) {
    try {
      const userId = req.user.id;
      console.log('调试OSS配置 - 用户ID:', userId);
      
      // 检查OSS配置和环境变量
      const configInfo = {
        region: this.ossConfig.getRegion(),
        bucketName: this.ossConfig.getBucketName(),
        envVars: {
          OSS_ACCESS_KEY_ID: process.env.OSS_ACCESS_KEY_ID ? '已设置' : '未设置',
          OSS_ACCESS_KEY_SECRET: process.env.OSS_ACCESS_KEY_SECRET ? '已设置' : '未设置',
          OSS_STS_ROLE_ARN: process.env.OSS_STS_ROLE_ARN ? '已设置' : '未设置'
        }
      };
      
      console.log('OSS配置信息:', JSON.stringify(configInfo));
      
      return {
        success: true,
        configInfo,
        userId,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('调试OSS配置失败:', error);
      return {
        success: false,
        error: error.message || error.toString(),
        timestamp: new Date().toISOString()
      };
    }
  }
}