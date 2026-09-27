import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { Resend } from "resend";
import { EmailMessage, EmailProvider } from "../email-provider.interface";
@Injectable()
export class ResendEmailProvider extends EmailProvider{
    private readonly resend: Resend;
    constructor() {
        super();
        const apiKey = process.env.RESEND_API_KEY;
        if (!apiKey) {
            throw new Error('RESEND_API_KEY is not configured')
        }
        this.resend = new Resend(apiKey);
    }
    async send(message: EmailMessage): Promise<void> {
        const from = process.env.EMAIL_FROM ?? 'intrenaloperationhub@gmail.com';
        const {data, error} = await this.resend.emails.send({
            from,
            to: [message.to],
            subject: message.subject,
            text: message.text
        });
        if (error) {
            console.error('Resend email error:', error);
            throw new InternalServerErrorException('Failed to send email notification')
        }
        console.log(`Completion email sent successfully. Email ID: ${data?.id}`)
    }
}