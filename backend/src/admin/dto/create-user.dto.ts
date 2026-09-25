import {IsEmail, isEmail, IsEnum, IsInt, IsOptional, IsString, MinLength} from 'class-validator';
import { UserRole } from '@prisma/client';
export class CreateUserDto {
    @IsString()
    @MinLength(2)
    name: string;
    @IsEmail()
    email: string;
    @IsString()
    @MinLength(8)
    password: string;
    @IsEnum(UserRole)
    role: UserRole;
    @IsOptional()
    @IsInt()
    departmentId?: number;
}