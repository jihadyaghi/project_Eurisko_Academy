import {IntakeResultDto} from '../dto/intake-result.dto';
export interface AiIntakeProvider {
    analyze(text: string): Promise<IntakeResultDto>;
}