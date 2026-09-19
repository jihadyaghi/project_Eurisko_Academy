import {IntakeCategory} from '../enums/intake-category.enum';
import {IntakeDepartment} from '../enums/intake-department.enum';
import {IntakePriority} from '../enums/intake-priority.enum';
export class IntakeResultDto {
    department: IntakeDepartment;
    category: IntakeCategory;
    priority: IntakePriority;
    summary: string;
}