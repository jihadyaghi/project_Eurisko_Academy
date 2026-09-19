import { Module } from '@nestjs/common';
import { RequestIntakeController } from './request-intake.controller';
import { RequestIntakeService } from './request-intake.service';
import { DeterministicAiIntakeProvider } from './providers/deterministic-ai-intake.provider';

@Module({
  controllers: [RequestIntakeController],
  providers: [RequestIntakeService, DeterministicAiIntakeProvider]
})
export class RequestIntakeModule {}
