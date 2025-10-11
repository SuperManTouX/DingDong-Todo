import { Controller, Sse, Req, BadRequestException } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { SseService, SseEvent } from './sse.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('SSE')
@Controller('events')
export class SseController {
  constructor(private readonly sseService: SseService) {}

  /**
   * SSE端点 - 用于推送实时更新事件
   * 支持从URL参数验证token（适用于EventSource）
   */
  @Sse()
  @ApiOperation({
    summary: '建立SSE连接',
    description: '建立Server-Sent Events连接，用于接收实时更新事件',
  })
  @ApiResponse({ status: 200, description: 'SSE连接成功建立' })
  @ApiResponse({ status: 401, description: '未授权访问' })
  async sse(@Req() req): Promise<Observable<any>> {
    try {
      // 从URL参数获取token（用于EventSource连接）
      const token = req.query.token as string;
      
      if (!token) {
        throw new BadRequestException('缺少认证token');
      }
      
      console.log('尝试从URL参数验证token');
      
      // 验证token并获取用户ID
      const userId = await this.sseService.validateToken(token);
      
      // 验证用户存在
      await this.sseService.getUserInfo(userId);
      
      console.log('通过URL参数token验证成功，用户ID:', userId);
      
      // 创建SSE流
      const sseStream = this.sseService.createSseStream(userId);
      
      // 转换为NestJS需要的格式
      return sseStream.pipe(
        map((data: SseEvent) => ({ data }))
      );
      
    } catch (error) {
      console.error('SSE连接验证失败:', error);
      // 创建一个立即失败的Observable
      const subject = new Observable<any>((observer) => {
        observer.error(error);
        observer.complete();
      });
      return subject;
    }
  }
}