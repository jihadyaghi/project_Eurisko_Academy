import {IntakeResultDto} from '../dto/intake-result.dto';
export const AI_INTAKE_PROVIDER = 'AI_INTAKE_PROVIDER'
export interface AiIntakeProvider {
    analyze(text: string): Promise<IntakeResultDto>;
}