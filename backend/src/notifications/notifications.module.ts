import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { EmailProvider } from './email-provider.interface';
import { ConsoleEmailProvider } from './providers/console-email.provider';
import { ResendEmailProvider } from './providers/resend-email.provider';
@Module({
  providers: [NotificationsService, ResendEmailProvider, {
    provide: EmailProvider,
    useExisting: ResendEmailProvider
  }],
  exports: [
    NotificationsService
  ]
})
export class NotificationsModule {}
