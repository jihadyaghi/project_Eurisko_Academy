import {IsEnum,IsInt,IsString,MinLength,} from 'class-validator';
import { IntakeCategory } from '../../request-intake/enums/intake-category.enum';
import { IntakePriority } from '../../request-intake/enums/intake-priority.enum';

export class CreateServiceRequestDto {
  @IsString()
  @MinLength(3)
  title: string;

  @IsString()
  @MinLength(3)
  description: string;

  @IsInt()
  departmentId: number;

  @IsEnum(IntakeCategory)
  category: IntakeCategory;

  @IsEnum(IntakePriority)
  priority: IntakePriority;
}