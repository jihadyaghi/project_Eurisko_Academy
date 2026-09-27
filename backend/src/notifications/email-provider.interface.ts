export interface EmailMessage {
    to: string;
    subject: string;
    text: string;
}
export abstract class EmailProvider {
    abstract send(message: EmailMessage): Promise<void>;
}