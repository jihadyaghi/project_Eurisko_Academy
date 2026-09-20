import { Module } from '@nestjs/common';
import { RequestIntakeController } from './request-intake.controller';
import { RequestIntakeService } from './request-intake.service';
import { DeterministicAiIntakeProvider } from './providers/deterministic-ai-intake.provider';
import { AI_INTAKE_PROVIDER } from './providers/ai-intake-provider.interface';
import { OpenRouterAiIntakeProvider } from './providers/openrouter-ai-intake.provider';
@Module({
  controllers: [RequestIntakeController],
  providers: [RequestIntakeService, DeterministicAiIntakeProvider, OpenRouterAiIntakeProvider, {provide: AI_INTAKE_PROVIDER, useFactory: (
    deterministicProvider: DeterministicAiIntakeProvider,
    openRouterProvider: OpenRouterAiIntakeProvider
  ) => {
    if (process.env.AI_INTAKE_PROVIDER === 'openrouter'){
      return openRouterProvider;
    }
    return deterministicProvider;
  },
  inject: [
    DeterministicAiIntakeProvider,
    OpenRouterAiIntakeProvider
  ]
}]
})
export class RequestIntakeModule {}
