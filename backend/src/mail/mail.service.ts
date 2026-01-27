import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly transporter;
  private readonly verificationCodes = new Map<string, { code: string; expiresAt: number }>();

  constructor() {
    // 创建邮件传输器 - 使用与项目中已有EmailService相同的配置
    this.transporter = nodemailer.createTransport({
      host: 'smtp.163.com',
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }

  /**
   * 生成随机验证码
   * @returns 6位数字验证码
   */
  private generateCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * 发送验证码到邮箱
   * @param email 接收验证码的邮箱
   */
  async sendVerificationCode(email: string): Promise<void> {
    const code = this.generateCode();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5分钟后过期

    // 存储验证码
    this.verificationCodes.set(email, { code, expiresAt });

    // 设置邮件内容
    const mailOptions = {
      from: `DingDongTodo <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'DingDongTodo - 注册验证码',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333;">欢迎注册 DingDongTodo</h2>
          <p>您的注册验证码是：</p>
          <div style="font-size: 24px; font-weight: bold; color: #007bff; margin: 20px 0;">${code}</div>
          <p>此验证码有效期为5分钟，请尽快完成注册。</p>
          <p>如果您没有尝试注册 DingDongTodo，请忽略此邮件。</p>
        </div>
      `,
    };

    try {
      // 发送邮件
      await this.transporter.sendMail(mailOptions);
      console.log(`验证码已发送到 ${email}`);
    } catch (error) {
      console.error('发送邮件失败:', error);
      // 添加更详细的错误信息，方便调试
      throw new Error(`发送验证码失败: ${error.message || '未知错误'}`);
    }
  }

  /**
   * 验证邮箱验证码
   * @param email 邮箱地址
   * @param code 用户输入的验证码
   * @returns 是否验证成功
   */
  verifyCode(email: string, code: string): boolean {
    const storedData = this.verificationCodes.get(email);

    if (!storedData) {
      return false; // 没有找到验证码
    }

    // 检查验证码是否过期
    if (Date.now() > storedData.expiresAt) {
      this.verificationCodes.delete(email); // 删除过期的验证码
      return false;
    }

    // 检查验证码是否匹配
    const isCodeValid = storedData.code === code;

    // 验证成功后删除验证码（防止重复使用）
    if (isCodeValid) {
      this.verificationCodes.delete(email);
    }

    return isCodeValid;
  }
}