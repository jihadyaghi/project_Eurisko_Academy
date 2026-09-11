import {IsEnum, IsInt} from 'class-validator';
import {ServiceRequestStatus} from '../enum/service-request-status.enum';
export class TransitionRequestDto {
    @IsEnum(ServiceRequestStatus)
    status: ServiceRequestStatus;
    @IsInt()
    handlerId: number;
}