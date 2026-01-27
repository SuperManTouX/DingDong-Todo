import { Controller, Get, Put, Body, Req, UseGuards, Post, Delete } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UserService } from './user.service';
import { FileService } from '../file/file.service';
import { OssConfig } from '../config/oss.config';
import { v4 as uuidv4 } from 'uuid';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('用户管理')
@Controller('users')
export class UserController {
  constructor(
    private userService: UserService,
    private ossConfig: OssConfig,
    private fileService: FileService
  ) {}

  /**
   * 删除用户历史头像
   */
  @ApiOperation({
    summary: '删除用户历史头像',
    description: '删除当前登录用户的指定历史头像（从OSS和数据库中移除）',
  })
  @ApiBearerAuth()
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        objectKey: { type: 'string', description: 'OSS对象键' },
        fileName: { type: 'string', description: '文件名' },
      },
    },
  })
  @ApiResponse({ status: 200, description: '删除成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 404, description: '头像不存在' })
  @UseGuards(AuthGuard('jwt'))
  @Delete('avatar/history')
  async deleteUserAvatar(@Req() req, @Body() body: { objectKey: string; fileName?: string }) {
    try {
      const userId = req.user.id;
      const { objectKey } = body;
      
      console.log('删除用户历史头像请求:', { userId, objectKey });
      
      if (!objectKey) {
        return {
          success: false,
          message: 'objectKey不能为空',
          timestamp: new Date().toISOString(),
        };
      }
      
      // 调用文件服务删除头像
      await this.fileService.deleteUserAvatar(userId, objectKey);
      
      return {
        success: true,
        message: '头像删除成功',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('删除用户历史头像失败:', error);
      
      if (error.name === 'NotFoundException') {
        return {
          success: false,
          message: error.message || '头像不存在或无权删除',
          timestamp: new Date().toISOString(),
        };
      }
      
      return {
        success: false,
        message: '删除头像失败，请稍后重试',
        error: error.message || error.toString(),
        timestamp: new Date().toISOString(),
      };
    }
  }

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
  async getProfile(@Req() req) {
    const result = await this.userService.findById(req.user.id);
    
    if (!result || !result.user) {
      return { success: false, message: '用户不存在' };
    }
    
    return {
      success: true,
      data: {
        user: result.user,
        avatarHistory: result.avatarHistory,
      },
    };
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
        nickname: { type: 'string', description: '用户昵称' },
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
    const userId = req.user.id;
    
    console.log(`[头像更新] 收到请求 - userId: ${userId}, avatarUrl: ${avatarUrl}`);
    
    try {
      // 更新用户头像URL到数据库，并保存到历史记录
      console.log(`[头像更新] 调用userService.updateAvatar方法...`);
      const updatedUser = await this.userService.updateAvatar(userId, avatarUrl);
      
      console.log(`[头像更新] 成功 - userId: ${userId}, 头像URL已更新并保存到历史记录`);
      
      return {
        success: true,
        message: '头像更新成功',
        avatarUrl: updatedUser.avatar
      };
    } catch (error) {
      console.error(`[头像更新] 失败 - userId: ${userId}, 错误:`, error);
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

  /**
   * 获取当前用户在阿里云OSS中的所有图片链接
   */
  @ApiOperation({
    summary: '获取用户OSS图片列表',
    description: '获取当前登录用户在阿里云OSS中的所有图片链接',
  })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  @UseGuards(AuthGuard('jwt'))
  @Get('oss-images')
  async getUserOssImages(@Req() req) {
    try {
      const userId = req.user.id;
      console.log('获取用户OSS图片列表 - 用户ID:', userId);
      
      // 获取OSS临时凭证
      const credentials = await this.ossConfig.getStsCredentials(userId, 'user-image-list', 3600);
      
      // 创建OSS客户端
      const ossClient = this.ossConfig.createOssClient(credentials);
      
      // 检查OSS客户端是否成功创建
      if (!ossClient) {
        console.warn('OSS客户端创建失败，返回空图片列表');
        return {
          success: true,
          message: 'OSS客户端创建失败，返回空图片列表',
          data: {
            total: 0,
            images: []
          },
          userId,
          timestamp: new Date().toISOString()
        };
      }
      
      // 用户图片存储目录前缀
      const userImagePrefix = `avatars/${userId}/`;
      console.log('用户图片目录前缀:', userImagePrefix);
      
      // 列出用户目录下的所有文件
      let allFiles: any[] = [];
      let marker: string | undefined = undefined;
      
      try {
        do {
          console.log(`执行OSS list操作 - marker: ${marker || '无'}`);
          const result = await ossClient.list({
            prefix: userImagePrefix,
            marker,
            maxKeys: 100 // 每次最多获取100个文件
          });
          
          console.log('OSS list结果:', result.objects?.length || 0, '个文件');
          
          // 添加找到的文件
          if (result.objects && Array.isArray(result.objects)) {
            allFiles = [...allFiles, ...result.objects];
          }
          
          // 更新marker以获取下一页
          marker = result.isTruncated ? result.nextMarker : undefined;
        } while (marker);
      } catch (listError) {
        console.error('列出OSS对象失败:', listError.message || listError);
        // 如果是权限或Bucket不存在的错误，返回空列表而不是抛出异常
        if (listError.message && (listError.message.includes('does not belong to you') || 
            listError.message.includes('NoSuchBucket') || 
            listError.message.includes('AccessDenied'))) {
          console.warn('OSS访问权限问题，返回空图片列表');
          return {
            success: true,
            message: 'OSS访问权限问题，返回空图片列表',
            data: {
              total: 0,
              images: []
            },
            userId,
            timestamp: new Date().toISOString()
          };
        }
        throw listError; // 其他错误继续抛出
      }
      
      // 过滤出图片文件并生成完整URL
      const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'];
      const imageFiles = allFiles
        .filter(file => {
          const lowerKey = file.name.toLowerCase();
          return imageExtensions.some(ext => lowerKey.endsWith(ext));
        })
        .map(file => ({
          fileName: file.name.split('/').pop() || '',
          objectKey: file.name,
          url: this.ossConfig.getObjectUrl(file.name),
          lastModified: file.lastModified,
          size: file.size
        }));
      
      console.log('过滤后的图片文件数量:', imageFiles.length);
      
      return {
        success: true,
        message: '获取用户OSS图片列表成功',
        data: {
          total: imageFiles.length,
          images: imageFiles
        },
        userId,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('获取用户OSS图片列表失败:', error.message || error);
      // 返回友好的错误响应，而不是抛出异常导致整个请求失败
      const userId = req.user?.id || 'unknown';
      return {
        success: true,
        message: '获取图片列表时发生错误，返回空列表',
        data: {
          total: 0,
          images: []
        },
        userId,
        timestamp: new Date().toISOString()
      };
    }
  }
}