import {Body, Controller, Get, Param, ParseIntPipe, Patch } from '@nestjs/common';
import {ServiceRequestsService} from './service-requests.service';
import {TransitionRequestDto} from './dto/transition-request.dto';
@Controller('service-requests')
export class ServiceRequestsController {
    constructor(private readonly serviceRequestsService: ServiceRequestsService) {}
    @ Get()
    findAll() {
        return this.serviceRequestsService.findAll();
    }
    @Get(':id')
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.serviceRequestsService.findOne(id);
    }
    @Patch(':id/status')
    transitionStatus(@Param('id', ParseIntPipe) id: number, @Body() body: TransitionRequestDto) {
        return this.serviceRequestsService.transitionStatus(id, body.status, body.handlerId);
    }
}
