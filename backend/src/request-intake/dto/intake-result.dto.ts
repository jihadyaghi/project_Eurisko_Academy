import {IntakeCategory} from '../enums/intake-category.enum';
import {IntakeDepartment} from '../enums/intake-department.enum';
import {IntakePriority} from '../enums/intake-priority.enum';
export class IntakeResultDto {
    department: IntakeDepartment | null;
    category: IntakeCategory | null;
    priority: IntakePriority;
    summary: string;
    needsReview: boolean
}