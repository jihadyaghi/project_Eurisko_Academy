import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ServiceRequestsModule } from './service-requests/service-requests.module';
import { PrismaModule } from './prisma/prisma.module';
import { RequestIntakeModule } from './request-intake/request-intake.module';

@Module({
  imports: [PrismaModule, ServiceRequestsModule, RequestIntakeModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
