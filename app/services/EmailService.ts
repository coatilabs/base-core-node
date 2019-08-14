import * as path from 'path';
import * as nodemailer from 'nodemailer';
import * as mailgunTransport from 'nodemailer-mailgun-transport';
import * as ejs from 'ejs';
import { log } from './../libraries/Log';
import { config } from './../config/config';

class EmailService {
  mailer: nodemailer.Transporter;

  constructor() {
    this.mailer = nodemailer.createTransport(mailgunTransport(config.email));
  }

  private send(
    email: string,
    subject: string,
    html: string,
  ): Promise<nodemailer.SentMessageInfo> {
    return this.mailer.sendMail({
      from: config.email.fromAddress,
      to: email,
      subject: subject,
      html: html,
    });
  }

  private compileTemplate(context: any): Promise<string> {
    return ejs.renderFile(
      path.join(__dirname, '../views/email/template.ejs'),
      context,
    );
  }

  async sendEmail({
    email,
    subject,
    page,
    context,
  }: {
    email: string;
    subject: string;
    page: string;
    context?: any;
  }): Promise<boolean> {
    if (context == null) context = {};
    context.page = page;

    const t = { __: (str) => str };

    context.__ = t.__;

    // Translate subject
    subject = t.__(subject);

    try {
      const html = await this.compileTemplate(context);
      log.debug(`Sending ${page} email to: ${email}`);
      await this.send(email, subject, html);
      return true;
    } catch (err) {
      log.error(`Error sending ${page} email to: ${email}`);
      return false;
    }
  }
}

const emailService = new EmailService();
export default emailService;
