import { Controller, Delete, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { FileService } from './file.service';
import type { Request } from 'express';

@ApiTags('文件管理')
@Controller('file')
export class FileController {
  constructor(private fileService: FileService) {}

  /**
   * 删除任务附件
   */
  @ApiOperation({
    summary: '删除任务附件',
    description: '删除用户的任务附件（从OSS和数据库中移除）',
  })
  @ApiBearerAuth()
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        objectKey: {
          type: 'string',
          description: 'OSS对象键',
          example: 'task-attachments/user-001/1758975264618.jpg',
        },
        imageUrl: {
          type: 'string',
          description: '图片完整URL（用于调试）',
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: '删除成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 404, description: '文件不存在或无权删除' })
  @UseGuards(AuthGuard('jwt'))
  @Delete('attachments')
  async deleteTaskAttachment(
    @Req() request: Request,
    @Body('objectKey') objectKey: string,
    @Body('imageUrl') imageUrl?: string
  ) {
    // 从请求中获取用户ID（通过AuthGuard注入）
    const userId = request.user?.['userId'] || request.user?.['id'];
    
    console.log(`接收到删除任务附件请求 - userId: ${userId}, objectKey: ${objectKey}, imageUrl: ${imageUrl}`);
    
    await this.fileService.deleteTaskAttachment(userId, objectKey);
    
    return {
      success: true,
      message: '文件删除成功',
    };
  }
}