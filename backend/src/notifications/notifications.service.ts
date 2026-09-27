import { Injectable } from '@nestjs/common';
import { EmailProvider } from './email-provider.interface';
@Injectable()
export class NotificationsService {
    constructor(private readonly emailProvider: EmailProvider){}
    async sendRequestCompletedEmail(input: {
        employeeEmail: string;
        employeeName: string;
        requestId: number;
        requestTitle: string;
    }) {
        await this.emailProvider.send({
            to: input.employeeEmail,
            subject: `Service Request #${input.requestId} Completed`,
            text: [
                 `Hello ${input.employeeName},`,
                 '',
                 'Your service request has been completed.',
                 '',
                 `Request: ${input.requestTitle}`,
                 `Request ID: #${input.requestId}`,
                 'Status: Completed',
                 '',
                 'You can log in to the Internal Operations Service Hub to view the request details.',
            ].join('\n')
        });
    }
}
