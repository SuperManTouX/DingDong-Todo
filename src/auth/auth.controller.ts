import { Controller, Post, Get, Body, Req, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private userService: UserService,
  ) {}

  /**
   * 用户登录接口
   */
  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(@Body() loginDto: {
    username: string;
    password: string;
  }) {
    return this.authService.login(loginDto.username, loginDto.password);
  }

  /**
   * 用户注册接口
   */
  @Post('register')
  async register(@Body() registerDto: {
    username: string;
    email: string;
    password: string;
  }) {
    const user = await this.userService.register(
      registerDto.username,
      registerDto.email,
      registerDto.password,
    );
    
    // 注册成功后自动登录，返回令牌
    return this.authService.login(registerDto.username, registerDto.password);
  }

  /**
   * 刷新令牌接口
   */
  @Post('refresh')
  async refresh(@Body() refreshDto: {
    token: string;
  }) {
    return this.authService.refreshToken(refreshDto.token);
  }

  /**
   * 测试受保护的路由
   */
  @UseGuards(AuthGuard('jwt'))
  @Get('profile')
  getProfile(@Req() req) {
    return req.user;
  }

  /**
   * 用户注销接口
   */
  @UseGuards(AuthGuard('jwt'))
  @Post('logout')
  async logout() {
    return this.authService.logout();
  }
}