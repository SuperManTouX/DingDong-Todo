import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    // 创建邮件传输器
    this.transporter = nodemailer.createTransport({
      host: 'smtp.163.com', // 163邮箱SMTP服务器
      port: 465, // 465端口用于SSL连接
      secure: true, // 使用SSL
      auth: {
        user: process.env.EMAIL_USER, // 163邮箱账号 - 请在.env文件中配置
        pass: process.env.EMAIL_PASS, // 163邮箱授权码 - 请在.env文件中配置
      },
    });
  }

  /**
   * 发送任务提醒邮件
   * @param to 收件人邮箱
   * @param taskTitle 任务标题
   * @param taskContent 任务内容
   */
  async sendReminderEmail(to: string, taskTitle: string, taskContent?: string) {
    const mailOptions = {
      from: `DingDongTodo <${process.env.EMAIL_USER}>`,
      to,
      subject: `任务提醒：${taskTitle}`,
      html: `
        <h3>任务提醒</h3>
        <p><strong>任务标题：</strong>${taskTitle}</p>
        ${taskContent ? `<p><strong>任务内容：</strong>${taskContent}</p>` : ''}
        <p>这是一条来自DingDongTodo的自动提醒邮件。</p>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`提醒邮件已发送至 ${to}`);
      return true;
    } catch (error) {
      console.error(`发送提醒邮件失败: ${error.message}`);
      return false;
    }
  }
}