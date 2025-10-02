import { Controller, Post, Get, Body, Req, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('认证')
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private userService: UserService,
  ) {}

  /**
   * 用户登录接口
   */
  @ApiOperation({
    summary: '用户登录',
    description: '用户登录获取访问令牌',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        username: { type: 'string', description: '用户名' },
        password: { type: 'string', description: '密码' },
      },
      required: ['username', 'password'],
    },
  })
  @ApiResponse({ status: 200, description: '登录成功' })
  @ApiResponse({ status: 401, description: '用户名或密码错误' })
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
  @ApiOperation({
    summary: '用户注册',
    description: '用户注册并自动登录',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        username: { type: 'string', description: '用户名（唯一）' },
        email: { type: 'string', description: '邮箱（唯一）' },
        password: { type: 'string', description: '密码' },
        bio: { type: 'string', description: '个人简介（可选）' },
      },
      required: ['username', 'email', 'password'],
    },
  })
  @ApiResponse({ status: 201, description: '注册成功' })
  @ApiResponse({ status: 409, description: '用户名或邮箱已存在' })
  @Post('register')
  async register(@Body() registerDto: {
    username: string;
    email: string;
    password: string;
    bio?: string;
  }) {
    const user = await this.userService.register(
      registerDto.username,
      registerDto.email,
      registerDto.password,
      registerDto.bio,
    );
    
    // 注册成功后自动登录，返回令牌
    return this.authService.login(registerDto.username, registerDto.password);
  }

  /**
   * 刷新令牌接口
   */
  @ApiOperation({
    summary: '刷新令牌',
    description: '使用现有令牌刷新获取新令牌',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        token: { type: 'string', description: '刷新令牌' },
      },
      required: ['token'],
    },
  })
  @ApiResponse({ status: 200, description: '令牌刷新成功' })
  @ApiResponse({ status: 401, description: '令牌无效' })
  @Post('refresh')
  async refresh(@Body() refreshDto: {
    token: string;
  }) {
    return this.authService.refreshToken(refreshDto.token);
  }

  /**
   * 测试受保护的路由
   */
  @ApiOperation({
    summary: '获取用户信息',
    description: '获取当前登录用户的信息',
  })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  @UseGuards(AuthGuard('jwt'))
  @Get('profile')
  getProfile(@Req() req) {
    return req.user;
  }

  /**
   * 用户注销接口
   */
  @ApiOperation({
    summary: '用户注销',
    description: '用户注销登录',
  })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: '注销成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  @UseGuards(AuthGuard('jwt'))
  @Post('logout')
  async logout() {
    return this.authService.logout();
  }
}