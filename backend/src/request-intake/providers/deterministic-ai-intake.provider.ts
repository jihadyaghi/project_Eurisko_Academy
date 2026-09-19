import {Injectable} from '@nestjs/common';
import { IntakeCategory } from '../enums/intake-category.enum';
import {IntakePriority} from '../enums/intake-priority.enum';
import {IntakeDepartment} from '../enums/intake-department.enum';
import {AiIntakeProvider} from './ai-intake-provider.interface';
import {IntakeResultDto} from '../dto/intake-result.dto';
@Injectable()
export class DeterministicAiIntakeProvider implements AiIntakeProvider {
    async analyze(text: string): Promise<IntakeResultDto> {
        const normalizedText = text.toLowerCase();
        if (normalizedText.includes('laptop') || normalizedText.includes('computer') || normalizedText.includes('software') || normalizedText.includes('access')) {
            return {
                department: IntakeDepartment.IT,
                category: normalizedText.includes('access') ? IntakeCategory.ACCESS : normalizedText.includes('software') ? IntakeCategory.SOFTWARE : IntakeCategory.HARDWARE,
                priority: normalizedText.includes('urgent') || normalizedText.includes('client meeting') || normalizedText.includes('cannot work') ? IntakePriority.HIGH : IntakePriority.NORMAL,
                summary: text.trim()
            };
        }
        if (normalizedText.includes('employment letter') || normalizedText.includes('leave') || normalizedText.includes('employee')){
            return {
                department: IntakeDepartment.HR,
                category: normalizedText.includes('leave') ? IntakeCategory.LEAVE : normalizedText.includes('employment letter') ? IntakeCategory.EMPLOYMENT_DOCUMENTS : IntakeCategory.EMPLOYEE_SUPPORT,
                priority: IntakePriority.NORMAL,
                summary: text.trim()
            };
        }
        if (normalizedText.includes('reimbursement') || normalizedText.includes('payroll') || normalizedText.includes('expense')){
            return {
                department: IntakeDepartment.FINANCE,
                category: normalizedText.includes('payroll') ? IntakeCategory.PAYROLL : normalizedText.includes('reimbursement') ? IntakeCategory.REIMBURSEMENT : IntakeCategory.EXPENSE,
                priority: IntakePriority.NORMAL,
                summary: text.trim()
            };
        }
        return {
            department: IntakeDepartment.IT,
            category: IntakeCategory.SOFTWARE,
            priority: IntakePriority.NORMAL,
            summary: text.trim()
        }
    }
}