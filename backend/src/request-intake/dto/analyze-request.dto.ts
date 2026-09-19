import {IsString, MinLength} from 'class-validator';
export class AnalyzeRequestDto {
    @IsString()
    @MinLength(3)
    text: string;
}