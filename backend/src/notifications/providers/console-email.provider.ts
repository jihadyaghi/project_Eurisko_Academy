import { EmailMessage, EmailProvider } from "../email-provider.interface";

export class ConsoleEmailProvider extends EmailProvider {
    async send(message: EmailMessage): Promise<void> {
        console.log('\n========== EMAIL NOTIFICATION ==========\n');
        console.log(`To: ${message.to}`);
        console.log(`Subject: ${message.subject}`);
        console.log('\nMessage:\n');
        console.log(message.text);
        console.log('\n========================================\n',);
    }
}