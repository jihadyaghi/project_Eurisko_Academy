import { BadGatewayException } from "@nestjs/common";
import {describe, expect, it} from 'vitest';
import { IntakeResultDto } from "./dto/intake-result.dto";
import { RequestIntakeService } from "./request-intake.service";
describe('RequestIntakeService', () => {
  it('should reject invalid AI output', async () => {
    const fakeProvider = {
      analyze: async() =>({
        department: 'NASA',
        category: 'hardware',
        priority: 'normal',
        summary: 'Invalid AI output test'
      }) as  unknown as IntakeResultDto,
    };
    const service = new RequestIntakeService(fakeProvider as any);
    await expect(service.analyze('My laptop is broken')).rejects.toThrow(BadGatewayException);
  });
  it('should handle AI provider failure safely', async () => {
    const failingProvider = {
      analyze: async() => {
        throw new Error('Provider unavilable');
      }
    };
    const service = new RequestIntakeService(failingProvider as any);
    await expect(service.analyze('I need help')).rejects.toThrow('AI assistance is temporarily unavailable')
  })
})