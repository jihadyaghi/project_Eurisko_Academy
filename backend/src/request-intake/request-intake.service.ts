import { BadGatewayException, Injectable, Inject } from '@nestjs/common';
import { IntakeResultDto } from './dto/intake-result.dto';
import { DeterministicAiIntakeProvider } from './providers/deterministic-ai-intake.provider';
import { IntakeDepartment } from './enums/intake-department.enum';
import { IntakeCategory } from './enums/intake-category.enum';
import { IntakePriority } from './enums/intake-priority.enum';
import { AI_INTAKE_PROVIDER } from './providers/ai-intake-provider.interface';
import type { AiIntakeProvider } from './providers/ai-intake-provider.interface';
@Injectable()
export class RequestIntakeService {
    constructor( @Inject(AI_INTAKE_PROVIDER) private readonly aiProvider: AiIntakeProvider, ){}
    async analyze(text: string): Promise<IntakeResultDto>{
        try {
        const candidate = await this.aiProvider.analyze(text);
        this.validateCandidate(candidate);
        return candidate;
        }
        catch (error){
            console.error('AI provider error:', error);
            if (error instanceof BadGatewayException){
                throw error;
            }
            throw new BadGatewayException('AI assistance is temporarily unavailable')
        }
    }
    private validateCandidate(candidate: IntakeResultDto): void {

      const validDepartments = Object.values(IntakeDepartment);
      const validCategories = Object.values(IntakeCategory);
      const validPriorities = Object.values(IntakePriority);
      if (!validPriorities.includes(candidate.priority)) {
       throw new BadGatewayException('AI provider returned an invalid priority',);
      }
      if (!candidate.summary?.trim()) {
       throw new BadGatewayException('AI provider returned an invalid summary',);
      }
      if (candidate.needsReview) {
      if (candidate.department !== null || candidate.category !== null) {
       throw new BadGatewayException('AI provider returned an invalid review candidate',);
      }
      return;
     }  
     if (candidate.department === null || !validDepartments.includes(candidate.department)) {
      throw new BadGatewayException('AI provider returned an invalid department',);
     }
     if (candidate.category === null || !validCategories.includes(candidate.category)) {
      throw new BadGatewayException('AI provider returned an invalid category',);
     }  
    }
}
