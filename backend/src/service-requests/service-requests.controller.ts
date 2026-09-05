import {Body, Controller, Get, Param, ParseIntPipe, Patch } from '@nestjs/common';
import {ServiceRequestsService} from './service-requests.service';
import {ServiceRequestStatus} from './enum/service-request-status.enum';
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
    transitionStatus(@Param('id', ParseIntPipe) id: number, @Body('status') status: ServiceRequestStatus) {
        return this.serviceRequestsService.transitionStatus(id, status);
    }
}
