import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UserService } from '../../user/user.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private userService: UserService,
    private configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_SECRET') || 'your-secret-key',
    });
  }

  async validate(payload: any) {
    // 从令牌的payload中提取用户ID并验证用户是否存在
    const result = await this.userService.findById(payload.sub);
    if (!result || !result.user) {
      throw new UnauthorizedException('无效的令牌');
    }
    
    // 返回的用户对象会被注入到请求对象的user属性中
    // 移除密码字段以保护敏感信息
    const { password: _, ...userWithoutPassword } = result.user;
    return userWithoutPassword;
  }
}