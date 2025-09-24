import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import { User } from '../user/user.entity';
import { log } from 'node:console';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
  ) {}

  /**
   * 登录功能
   */
  async login(username: string, password: string): Promise<{
    access_token: string;
    user: Omit<User, 'password'>;
  }> {
    const user = await this.userService.validateUser(username, password);
    if (!user) {
      throw new UnauthorizedException('用户名或密码错误');
    }
    log(user);

    // 生成JWT令牌
    const payload = {
      username: user.username,
      sub: user.id,
    };

    // 移除密码字段，只返回需要的用户信息
    const { password: _, ...userWithoutPassword } = user;

    return {
      access_token: this.jwtService.sign(payload),
      user: userWithoutPassword,
    };
  }

  /**
   * 验证JWT令牌
   */
  async validateToken(token: string): Promise<User | null> {
    try {
      const payload = this.jwtService.verify(token);
      return this.userService.findById(payload.sub);
    } catch (error) {
      return null;
    }
  }

  /**
   * 刷新JWT令牌
   */
  async refreshToken(token: string): Promise<{ access_token: string }> {
    try {
      const payload = this.jwtService.verify(token, { ignoreExpiration: true });
      const user = await this.userService.findById(payload.sub);
      
      if (!user) {
        throw new UnauthorizedException('用户不存在');
      }

      const newPayload = {
        username: user.username,
        sub: user.id,
      };

      return {
        access_token: this.jwtService.sign(newPayload),
      };
    } catch (error) {
      throw new UnauthorizedException('令牌无效');
    }
  }

  /**
   * 用户注销功能
   * 注意：由于JWT是无状态的，此方法主要是为了提供统一的API接口
   * 前端在调用此接口后应删除存储的token
   */
  async logout(): Promise<{ message: string }> {
    // 这里可以添加一些额外的注销逻辑，如清除用户会话数据等
    return {
      message: '用户已成功注销',
    };
  }
}